import { Redirect } from 'expo-router';

export default function LifeInsuranceApplications() {
  return <Redirect href={{ pathname: '/admin/leads', params: { product: 'life-insurance' } }} />;
}
