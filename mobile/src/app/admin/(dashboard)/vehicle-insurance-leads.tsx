import { Redirect } from 'expo-router';

export default function SavedApplications() {
  return <Redirect href={{ pathname: '/admin/leads', params: { product: 'motor-insurance' } }} />;
}
