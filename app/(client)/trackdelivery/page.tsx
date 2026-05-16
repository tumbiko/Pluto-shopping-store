import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import NoAccessToTrackDelivery from "@/components/ui/NoAccessToTrackDelivery";
import Container from "@/components/Container";
import TrackDeliveryClient from "./TrackDeliveryClient";
import { getMyOrders } from "@/Actions/getMyOrders";

export default async function TrackDeliveryPage() {
  const user = await currentUser();

  // If user is not signed in, show NoAccess message
  if (!user) {
    return (
      <Container>
        <NoAccessToTrackDelivery />
      </Container>
    );
  }

  // Fetch orders from Sanity securely on the server
  const orders = await getMyOrders(user.id);

  return (
    <Container>
      <TrackDeliveryClient orders={orders} />
    </Container>
  );
}
