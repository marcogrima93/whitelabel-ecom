"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { calcTotal } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CheckCircle,
  CreditCard,
  Truck,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Package,
  BookUser,
  Banknote,
} from "lucide-react";
import StripeForm from "@/components/checkout/StripeForm";
import { PhoneInput, joinPhone, splitPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
      loadStripe(stripePublishableKey)
    );
  }
  return stripePromise;
}

type CheckoutStep = "delivery" | "payment" | "confirmation";
type DeliveryType = "DELIVERY" | "COLLECTION";
type AddressMode = "saved" | "new";
type PaymentMethod = "STRIPE" | "CASH";

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  line_1: string;
  line_2: string | null;
  city: string;
  postcode: string;
  is_default: boolean;
}

const towns = siteConfig.delivery.towns;
const defaultTown = towns[0]?.name || "";

export default function CheckoutPage() {
  const { items, getSubtotal, getVatAmount, clearCart } = useCartStore();
  const router = useRouter();
  const { currency } = siteConfig;

  const [step, setStep] = useState<CheckoutStep>("delivery");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutOrderNumber, setCheckoutOrderNumber] = useState("");

  // Determine default payment method from config
  const stripeEnabled = siteConfig.payments.stripe.enabled;
  const codEnabled = siteConfig.payments.cashOnDelivery.enabled;
  const defaultPaymentMethod: PaymentMethod = stripeEnabled ? "STRIPE" : "CASH";
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(defaultPaymentMethod);

  // Saved address
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [addressMode, setAddressMode] = useState<AddressMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Form state
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    line1: "",
    line2: "",
    town: defaultTown,
    postcode: "",
    deliverySlot: siteConfig.delivery.slots[0]?.value || "",
    preferredDay: "monday",
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");

  const updateForm = (field: string, value: string) =>
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));

  // Fetch saved addresses on mount
  useEffect(() => {
    setLoadingAddresses(true);
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          setAddressMode("saved");
          const def = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(def.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, []);

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const subtotal = getSubtotal();
  const vatAmount = getVatAmount();

  const deliveryTownFee = (() => {
    if (deliveryType === "COLLECTION") return 0;
    if (subtotal >= siteConfig.delivery.freeThreshold) return 0;
    const town =
      addressMode === "saved" && selectedAddress
        ? selectedAddress.city
        : deliveryForm.town;
    return towns.find((t) => t.name === town)?.fee ?? towns[0]?.fee ?? 0;
  })();

  const total = calcTotal(subtotal, deliveryTownFee);

  if (items.length === 0 && step !== "confirmation") {
    router.push("/cart");
    return null;
  }

  const handlePaymentSuccess = (num: string) => {
    setOrderNumber(num);
    clearCart();
    setStep("confirmation");
  };

  // Build the address object for the API from either saved or new
  const buildDeliveryAddress = () => {
    if (addressMode === "saved" && selectedAddress) {
      return {
        fullName: selectedAddress.full_name,
        phone: selectedAddress.phone,
        line1: selectedAddress.line_1,
        line2: selectedAddress.line_2 || "",
        city: selectedAddress.city,
        postcode: selectedAddress.postcode,
      };
    }
    return {
      fullName: deliveryForm.fullName,
      phone: deliveryForm.phone,
      line1: deliveryForm.line1,
      line2: deliveryForm.line2,
      city: deliveryForm.town,
      postcode: deliveryForm.postcode,
    };
  };

  const getCustomerName = () =>
    addressMode === "saved" && selectedAddress
      ? selectedAddress.full_name
      : deliveryForm.fullName;

  const initPayment = async () => {
    if (!deliveryForm.email || !getCustomerName()) {
      alert("Please fill in your name and email first.");
      return;
    }

    setStep("payment");

    // COD: create order immediately, no Stripe needed
    if (selectedPaymentMethod === "CASH") {
      if (loading) return;
      setLoading(true);
      try {
        const deliveryAddress = deliveryType === "DELIVERY" ? buildDeliveryAddress() : null;
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              name: item.name,
              image: item.image,
              selectedOption: item.selectedOption,
              pricePerUnit: item.pricePerUnit,
              quantity: item.quantity,
            })),
            customerEmail: deliveryForm.email,
            customerName: getCustomerName(),
            deliveryMethod: deliveryType,
            deliveryAddress,
            deliverySlot: `${deliveryForm.preferredDay} - ${deliveryForm.deliverySlot}`,
            paymentMethod: "CASH",
          }),
        });
        const data = await res.json();
        if (data.orderNumber) {
          handlePaymentSuccess(data.orderNumber);
        }
      } catch (err) {
        console.error("COD checkout error:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Stripe: get client secret as before
    if (clientSecret) return;
    try {
      const deliveryAddress = deliveryType === "DELIVERY" ? buildDeliveryAddress() : null;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            image: item.image,
            selectedOption: item.selectedOption,
            pricePerUnit: item.pricePerUnit,
            quantity: item.quantity,
          })),
          customerEmail: deliveryForm.email,
          customerName: getCustomerName(),
          deliveryMethod: deliveryType,
          deliveryAddress,
          deliverySlot: `${deliveryForm.preferredDay} - ${deliveryForm.deliverySlot}`,
          paymentMethod: "STRIPE",
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setCheckoutOrderNumber(data.orderNumber);
      } else {
        console.error("No client secret inside response", data);
      }
    } catch (err) {
      console.error("Failed to initialize payment:", err);
    }
  };

  const steps: { key: CheckoutStep; label: string; icon: React.ElementType }[] = [
    { key: "delivery", label: "Delivery", icon: Truck },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "confirmation", label: "Confirmation", icon: CheckCircle },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Progress */}
      <div className="flex items-center justify-center mb-10">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : steps.indexOf(steps.find((x) => x.key === step)!) > i
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 md:w-16 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Delivery */}
          {step === "delivery" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Delivery Details</h2>

              {/* Delivery / Collection toggle */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("DELIVERY")}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    deliveryType === "DELIVERY"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <Truck className="h-5 w-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType("COLLECTION")}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    deliveryType === "COLLECTION"
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  <MapPin className="h-5 w-5 mx-auto mb-2" />
                  <span className="text-sm font-medium">Collection</span>
                </button>
              </div>

              {deliveryType === "DELIVERY" ? (
                <div className="space-y-4">
                  {/* Saved address toggle — only shown when addresses exist */}
                  {!loadingAddresses && savedAddresses.length > 0 && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BookUser className="h-4 w-4" />
                        Deliver to
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAddressMode("saved")}
                          className={`rounded-md border px-3 py-2 text-sm transition-all ${
                            addressMode === "saved"
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                              : "border-input hover:bg-accent"
                          }`}
                        >
                          Saved address
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressMode("new")}
                          className={`rounded-md border px-3 py-2 text-sm transition-all ${
                            addressMode === "new"
                              ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                              : "border-input hover:bg-accent"
                          }`}
                        >
                          New address
                        </button>
                      </div>

                      {addressMode === "saved" && (
                        <div className="space-y-2">
                          <Select
                            value={selectedAddressId}
                            onValueChange={setSelectedAddressId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an address" />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map((addr) => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  <span className="flex items-center gap-2">
                                    {addr.label}
                                    {addr.is_default && (
                                      <Badge variant="secondary" className="text-xs">Default</Badge>
                                    )}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedAddress && (
                            <div className="text-sm text-muted-foreground bg-background rounded-md px-3 py-2 border">
                              <p className="font-medium text-foreground">{selectedAddress.full_name}</p>
                              <p>{selectedAddress.line_1}{selectedAddress.line_2 ? `, ${selectedAddress.line_2}` : ""}</p>
                              <p>{selectedAddress.city}, {selectedAddress.postcode}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {loadingAddresses && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading saved addresses...
                    </div>
                  )}

                  {/* Contact details — always shown */}
                  <div className="grid grid-cols-2 gap-4">
                    {(addressMode === "new" || savedAddresses.length === 0) && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="ck-name">Full Name</Label>
                          <Input
                            id="ck-name"
                            value={deliveryForm.fullName}
                            onChange={(e) => updateForm("fullName", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ck-phone">Phone</Label>
                          <PhoneInput
                            id="ck-phone"
                            countryCode={phoneCountryCode}
                            number={phoneNumber}
                            onCountryCodeChange={(c) => {
                              setPhoneCountryCode(c);
                              updateForm("phone", joinPhone(c, phoneNumber));
                            }}
                            onNumberChange={(n) => {
                              setPhoneNumber(n);
                              updateForm("phone", joinPhone(phoneCountryCode, n));
                            }}
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ck-email">Email</Label>
                    <Input
                      id="ck-email"
                      type="email"
                      value={deliveryForm.email}
                      onChange={(e) => updateForm("email", e.target.value)}
                      required
                    />
                  </div>

                  {/* Address fields — only shown for new address */}
                  {(addressMode === "new" || savedAddresses.length === 0) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="ck-line1">Address Line 1</Label>
                        <Input
                          id="ck-line1"
                          value={deliveryForm.line1}
                          onChange={(e) => updateForm("line1", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ck-line2">Address Line 2 (optional)</Label>
                        <Input
                          id="ck-line2"
                          value={deliveryForm.line2}
                          onChange={(e) => updateForm("line2", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Town / City</Label>
                          <Select
                            value={deliveryForm.town}
                            onValueChange={(v) => updateForm("town", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select town" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              {towns.map((t) => (
                                <SelectItem key={t.name} value={t.name}>
                                  {t.name}
                                  {subtotal < siteConfig.delivery.freeThreshold && (
                                    <span className="ml-2 text-muted-foreground text-xs">
                                      ({currency.symbol}{t.fee.toFixed(2)})
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ck-post">Postcode</Label>
                          <Input
                            id="ck-post"
                            value={deliveryForm.postcode}
                            onChange={(e) => updateForm("postcode", e.target.value)}
                            placeholder="e.g. BKR 1234"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Delivery slot */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preferred Day</Label>
                      <Select
                        value={deliveryForm.preferredDay}
                        onValueChange={(v) => updateForm("preferredDay", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((d) => (
                            <SelectItem key={d} value={d}>
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Slot</Label>
                      <Select
                        value={deliveryForm.deliverySlot}
                        onValueChange={(v) => updateForm("deliverySlot", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {siteConfig.delivery.slots.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {subtotal >= siteConfig.delivery.freeThreshold && (
                    <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md">
                      You qualify for free delivery!
                    </p>
                  )}
                </div>
              ) : (
                /* Collection form */
                <div className="p-6 bg-muted/50 rounded-lg border space-y-4">
                  <h3 className="font-semibold mb-1">Collection Address</h3>
                  <p className="text-sm text-muted-foreground">
                    {siteConfig.delivery.pickupAddress}
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ck-col-name">Your Name</Label>
                      <Input
                        id="ck-col-name"
                        value={deliveryForm.fullName}
                        onChange={(e) => updateForm("fullName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ck-col-email">Email</Label>
                      <Input
                        id="ck-col-email"
                        type="email"
                        value={deliveryForm.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Collection Slot</Label>
                      <Select
                        value={deliveryForm.deliverySlot}
                        onValueChange={(v) => updateForm("deliverySlot", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {siteConfig.delivery.slots.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              {(stripeEnabled || codEnabled) && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-semibold text-sm">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {stripeEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("STRIPE")}
                        className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                          selectedPaymentMethod === "STRIPE"
                            ? "border-primary bg-primary/5 ring-2 ring-primary"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <CreditCard className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Card / Online</p>
                          <p className="text-xs text-muted-foreground">Pay securely via Stripe</p>
                        </div>
                      </button>
                    )}
                    {codEnabled && (
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod("CASH")}
                        className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                          selectedPaymentMethod === "CASH"
                            ? "border-primary bg-primary/5 ring-2 ring-primary"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        <Banknote className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{siteConfig.payments.cashOnDelivery.label}</p>
                          <p className="text-xs text-muted-foreground">{siteConfig.payments.cashOnDelivery.description}</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" asChild>
                  <Link href="/cart">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
                  </Link>
                </Button>
                <Button onClick={initPayment} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "payment" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Payment</h2>

              {selectedPaymentMethod === "CASH" ? (
                /* COD — order was already created in initPayment, show spinner then it redirects to confirmation */
                <div className="p-6 rounded-lg border bg-card space-y-4 text-center">
                  <Banknote className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    {loading ? "Placing your order..." : "Order placed. Redirecting..."}
                  </p>
                  {loading && <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />}
                </div>
              ) : (
                /* Stripe */
                <div className="p-6 rounded-lg border bg-card space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Secure payment via Stripe
                  </div>
                  {!clientSecret ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                      <StripeForm
                        amount={total}
                        orderNumber={checkoutOrderNumber}
                        onSuccess={handlePaymentSuccess}
                        onBack={() => setStep("delivery")}
                      />
                    </Elements>
                  )}
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1 rounded" required />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === "confirmation" && (
            <div className="text-center space-y-6 py-8">
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Order Confirmed!</h2>
                <p className="text-muted-foreground mt-2">
                  Thank you for your order. Your order number is:
                </p>
                <p className="text-xl font-mono font-bold mt-2 text-primary">{orderNumber}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground max-w-md mx-auto">
                <p>
                  A confirmation email has been sent to{" "}
                  <strong>{deliveryForm.email}</strong>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button asChild>
                  <Link href="/products">Continue Shopping</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/account/orders">View Orders</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        {step !== "confirmation" && (
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-lg border bg-card p-6 space-y-4">
              <h3 className="font-bold">Order Summary</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedOption}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span>
                      {formatPrice(
                        item.pricePerUnit * item.quantity,
                        currency.code,
                        currency.locale
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal, currency.code, currency.locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    VAT ({(siteConfig.vatRate * 100).toFixed(0)}%{siteConfig.vatIncluded ? " incl." : ""})
                  </span>
                  <span>{formatPrice(vatAmount, currency.code, currency.locale)}</span>
                </div>
                {deliveryType === "DELIVERY" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>
                      {deliveryTownFee === 0
                        ? "Free"
                        : formatPrice(deliveryTownFee, currency.code, currency.locale)}
                    </span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(total, currency.code, currency.locale)}</span>
              </div>

              {/* Show selected town fee note */}
              {deliveryType === "DELIVERY" &&
                subtotal < siteConfig.delivery.freeThreshold &&
                deliveryTownFee > 0 && (
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    Delivery to{" "}
                    <strong>
                      {addressMode === "saved" && selectedAddress
                        ? selectedAddress.city
                        : deliveryForm.town}
                    </strong>
                    : {currency.symbol}{deliveryTownFee.toFixed(2)}
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
