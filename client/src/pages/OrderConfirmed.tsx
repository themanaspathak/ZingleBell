import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";

const OrderConfirmed: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card className="p-6 text-center">
        <div className="mb-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your order has been received and is being prepared.
        </p>
        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Place Another Order
            </Button>
          </Link>
          <Link href="/order-history">
            <Button variant="outline" className="w-full">
              View Order History
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default OrderConfirmed;