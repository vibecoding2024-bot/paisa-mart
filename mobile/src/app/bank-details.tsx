import ServiceUnavailable from "@/components/ServiceUnavailable";

// Bank details were previously kept only on the device, unencrypted, with copy implying payouts would be
// sent there. There is no server-side bank details service, so the app no longer collects them.
export default function BankDetailsScreen() {
  return (
    <ServiceUnavailable
      title="Bank details"
      message="Bank details cannot be added in the app yet. Approved payouts are arranged by the Paisa Mart team, who will contact you to confirm payment details."
    />
  );
}
