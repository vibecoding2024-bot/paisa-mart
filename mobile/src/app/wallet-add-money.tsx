import ServiceUnavailable from "@/components/ServiceUnavailable";

// No payment gateway or wallet service exists yet, so no balance or transaction is shown or simulated.
export default function Screen() {
  return (
    <ServiceUnavailable
      title="Cash on Credit Card"
      message="This service is not available in the app yet. There is no wallet balance, and you cannot add money, withdraw or view wallet transactions here."
    />
  );
}
