"""Local preparation only: clean source -> fresh Expo export -> approved packaging."""

import json

import os

from pathlib import Path

import subprocess

import sys

from datetime import datetime

from uuid import uuid4

from release_validation import PRODUCTION_API, files, safe_output

import prepare_home_loan_release



ROOT = Path(__file__).resolve().parents[2]

def git(*args):

    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True).strip()



def main(output, date):

    datetime.strptime(date, '%Y%m%d')

    if git('status', '--porcelain'):

        raise ValueError('Commit source changes before production preparation')

    commit = git('rev-parse', 'HEAD')

    output = safe_output(output)

    if output == ROOT or ROOT in output.parents:

        raise ValueError('Use an output directory outside the source checkout')

    raw = output / ('raw-' + commit[:8] + '-' + uuid4().hex[:8])

    output.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()

    env.update({'EXPO_PUBLIC_API_URL': PRODUCTION_API, 'EXPO_PUBLIC_BACKEND_URL': PRODUCTION_API,

                'EXPO_PUBLIC_VIBECODE_BACKEND_URL': PRODUCTION_API, 'DARK_MODE': 'class', 'EXPO_NO_DOTENV': '1'})

    subprocess.run(['node', 'node_modules/expo/bin/cli', 'export', '--clear', '--max-workers', '2', '--platform', 'web', '--output-dir', str(raw)], cwd=ROOT / 'mobile', env=env, check=True)

    if git('rev-parse', 'HEAD') != commit or git('status', '--porcelain'):

        raise ValueError('Source changed during build')

    receipt = {'source_commit': commit, 'api_url': PRODUCTION_API, 'files': files(raw),

               'build_cwd': 'mobile', 'dotenv_loading': False}

    raw.with_suffix('.build.json').write_text(json.dumps(receipt, indent=2) + '\n')

    prepare_home_loan_release.package(raw, output, commit, date)



if __name__ == '__main__':

    if len(sys.argv) != 3:

        raise SystemExit('Usage: python deployment/build_production_release.py OUTPUT_OUTSIDE_CHECKOUT YYYYMMDD')

    main(*sys.argv[1:])

