"use client";
// Checkout page — client component (uses hooks, Stripe Elements, cart store)
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/lib/store/cart";
import { siteConfig } from "@/site.config";
import { calcTotal, calcVatAmount } from "@/lib/pricing";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  CalendarDays,
  User,
} from "lucide-react";
import StripeForm from "@/components/checkout/StripeForm";
import { PhoneInput, joinPhone, splitPhone, DEFAULT_COUNTRY_CODE } from "@/components/ui/phone-input";

// ── Malta date helpers ────────────────────────────────────────────────────────
// Malta is UTC+1 (CET) or UTC+2 (CEST). We use the browser's locale-aware
// Date so it works correctly for customers in Malta.
function getMaltaNow(): Date {
  // "Europe/Malta" gives the correct wall-clock time in Malta
  const maltaStr = new Date().toLocaleString("en-GB", { timeZone: "Europe/Malta" });
  // maltaStr: "DD/MM/YYYY, HH:MM:SS"
  const [datePart, timePart] = maltaStr.split(", ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const d = new Date(year, month - 1, day, hour, minute, 0);
  return d;
}

/** Earliest selectable date (Malta time):
 *  - before noon → tomorrow
 *  - noon or after → day after tomorrow
 */
function getMinSelectableDate(): Date {
  const now = getMaltaNow();
  const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() < 12) {
    minDate.setDate(minDate.getDate() + 1); // tomorrow
  } else {
    minDate.setDate(minDate.getDate() + 2); // day after tomorrow
  }
  return minDate;
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateLabel(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-MT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

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
  const { items, getSubtotal, getDiscountAmount, discountCode, discountPercentage, clearCart, additionalNotes } = useCartStore();
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

  // Logged-in user profile (pre-fills contact fields)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; phone: string | null } | null>(null);

  // Save-address checkbox (only shown for logged-in users entering a new address)
  const [saveAddress, setSaveAddress] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState("Home");

  // Delivery settings (blocked days/dates from admin)
  const [blockedDays, setBlockedDays] = useState<number[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  // Compute min date once on mount (avoids hydration mismatch)
  const minDate = useMemo(() => toDateInputValue(getMinSelectableDate()), []);

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
    preferredDate: "", // filled on mount below
  });
  const [phoneCountryCode, setPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState("");
  // Separate phone state for collection form
  const [colPhoneCountryCode, setColPhoneCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [colPhoneNumber, setColPhoneNumber] = useState("");

  // Set default date after mount so SSR doesn't mismatch
  useEffect(() => {
    setDeliveryForm((prev) => ({ ...prev, preferredDate: toDateInputValue(getMinSelectableDate()) }));
  }, []);

  // Fetch delivery settings (blocked days/dates)
  useEffect(() => {
    fetch("/api/delivery-settings")
      .then((r) => r.json())
      .then((s) => {
        if (s?.blocked_days) setBlockedDays(s.blocked_days);
        if (s?.blocked_dates) setBlockedDates(s.blocked_dates);
      })
      .catch(() => {});
  }, []);

  // Fetch logged-in user profile and pre-fill contact fields
  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => r.json())
      .then((profile) => {
        if (profile?.email) {
          setUserProfile({ name: profile.name || "", email: profile.email, phone: profile.phone || null });
          setDeliveryForm((prev) => ({
            ...prev,
            fullName: profile.name || prev.fullName,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
          }));
          // Split stored phone back into country code + number for PhoneInput
          if (profile.phone) {
            const { countryCode, number } = splitPhone(profile.phone);
            setPhoneCountryCode(countryCode);
            setPhoneNumber(number);
            setColPhoneCountryCode(countryCode);
            setColPhoneNumber(number);
          }
        }
      })
      .catch(() => {});
  }, []);

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
  const discountAmount = getDiscountAmount();

  const deliveryTownFee = (() => {
    if (deliveryType === "COLLECTION") return 0;
    if (subtotal >= siteConfig.delivery.freeThreshold) return 0;
    const town =
      addressMode === "saved" && selectedAddress
        ? selectedAddress.city
        : deliveryForm.town;
    return towns.find((t) => t.name === town)?.fee ?? towns[0]?.fee ?? 0;
  })();

  // VAT is back-calculated from (discounted subtotal + delivery) so the delivery
  // charge is always included in the VAT figure, regardless of vatIncluded mode.
  const discountedSubtotal = subtotal - discountAmount;
  const vatAmount = calcVatAmount(discountedSubtotal, deliveryTownFee);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Redirect to cart if no items — only after hydration so Zustand has rehydrated from localStorage
  useEffect(() => {
    if (!mounted) return;
    if (items.length === 0 && step !== "confirmation") {
      router.push("/cart");
    }
  }, [mounted, items.length, step, router]);

  const total = calcTotal(discountedSubtotal, deliveryTownFee);

  // Show a consistent skeleton until hydrated (avoids server/client mismatch)
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="h-8 w-40 bg-muted rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 rounded-lg border bg-muted animate-pulse" />
            <div className="h-48 rounded-lg border bg-muted animate-pulse" />
          </div>
          <div className="h-72 rounded-lg border bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== "confirmation") {
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

  const saveNewAddressIfRequested = async () => {
    if (!saveAddress || addressMode !== "new" || deliveryType !== "DELIVERY" || !userProfile) return;
    if (!deliveryForm.line1 || !deliveryForm.town || !deliveryForm.postcode) return;
    try {
      await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: saveAddressLabel || "Home",
          full_name: deliveryForm.fullName,
          phone: deliveryForm.phone,
          line_1: deliveryForm.line1,
          line_2: deliveryForm.line2 || null,
          city: deliveryForm.town,
          region: deliveryForm.town,
          postcode: deliveryForm.postcode,
          is_default: savedAddresses.length === 0,
        }),
      });
    } catch {
      // Non-blocking — order continues even if address save fails
    }
  };

  const initPayment = async () => {
    if (!deliveryForm.email || !getCustomerName()) {
      alert("Please fill in your name and email first.");
      return;
    }

    // Block submission if the selected date is a blocked day or specific date
    const iso = deliveryForm.preferredDate;
    if (iso) {
      const [y, m, d] = iso.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (blockedDays.includes(date.getDay()) || blockedDates.includes(iso)) {
        alert("The selected date is unavailable. Please choose another date.");
        return;
      }
    }

    setStep("payment");

    // COD: create order immediately, no Stripe needed
    if (selectedPaymentMethod === "CASH") {
      if (loading) return;
      setLoading(true);
      try {
        await saveNewAddressIfRequested();
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
            deliverySlot: `${formatDateLabel(deliveryForm.preferredDate)} - ${deliveryForm.deliverySlot}`,
            paymentMethod: "CASH",
            discountCode: discountCode || null,
            discountAmount: discountAmount || 0,
            notes: additionalNotes || null,
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
      await saveNewAddressIfRequested();
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
          deliverySlot: `${formatDateLabel(deliveryForm.preferredDate)} - ${deliveryForm.deliverySlot}`,
          paymentMethod: "STRIPE",
          discountCode: discountCode || null,
          discountAmount: discountAmount || 0,
          notes: additionalNotes || null,
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

                  {/* Contact details — hidden for logged-in users (pre-filled from profile) */}
                  {(addressMode === "new" || savedAddresses.length === 0) && (
                    <>
                      {userProfile ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border">
                          <User className="h-4 w-4 shrink-0" />
                          <span>
                            Ordering as <span className="font-medium text-foreground">{userProfile.name}</span>
                            {" "}({userProfile.email})
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        </div>
                      )}
                    </>
                  )}

                  {/* Email — hidden for logged-in users */}
                  {!userProfile && (
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
                  )}

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

                  {/* Save address checkbox — only for logged-in users on new addresses */}
                  {userProfile && (addressMode === "new" || savedAddresses.length === 0) && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="ck-save-addr"
                          checked={saveAddress}
                          onCheckedChange={(v) => setSaveAddress(!!v)}
                        />
                        <Label htmlFor="ck-save-addr" className="cursor-pointer font-normal">
                          Save this address to my account
                        </Label>
                      </div>
                      {saveAddress && (
                        <div className="space-y-2">
                          <Label htmlFor="ck-addr-label">Address label</Label>
                          <Input
                            id="ck-addr-label"
                            value={saveAddressLabel}
                            onChange={(e) => setSaveAddressLabel(e.target.value)}
                            placeholder="e.g. Home, Office, Parents"
                            maxLength={40}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery date + slot */}
                  {(() => {
                    const isDeliveryDateBlocked = (iso: string) => {
                      if (!iso) return false;
                      const [y, m, d] = iso.split("-").map(Number);
                      const date = new Date(y, m - 1, d);
                      if (blockedDays.includes(date.getDay())) return true;
                      if (blockedDates.includes(iso)) return true;
                      return false;
                    };
                    const dateBlocked = isDeliveryDateBlocked(deliveryForm.preferredDate);
                    return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ck-date">
                        <CalendarDays className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                        Preferred Date
                      </Label>
                      <Input
                        id="ck-date"
                        type="date"
                        value={deliveryForm.preferredDate}
                        min={minDate}
                        onChange={(e) => updateForm("preferredDate", e.target.value)}
                        required
                        className={`cursor-pointer ${dateBlocked ? "border-destructive" : ""}`}
                      />
                      {dateBlocked && (
                        <p className="text-xs text-destructive">
                          This date is unavailable. Please select another.
                        </p>
                      )}
                      {deliveryForm.preferredDate && !dateBlocked && (
                        <p className="text-xs text-muted-foreground">
                          {formatDateLabel(deliveryForm.preferredDate)}
                        </p>
                      )}
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
                    );
                  })()}

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
                    {userProfile ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background rounded-md px-3 py-2 border">
                        <User className="h-4 w-4 shrink-0" />
                        <span>
                          Collecting as <span className="font-medium text-foreground">{userProfile.name}</span>
                          {" "}({userProfile.email})
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Name + phone on separate lines on mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <Label htmlFor="ck-col-phone">Phone</Label>
                            <PhoneInput
                              id="ck-col-phone"
                              countryCode={colPhoneCountryCode}
                              number={colPhoneNumber}
                              onCountryCodeChange={(c) => {
                                setColPhoneCountryCode(c);
                                updateForm("phone", joinPhone(c, colPhoneNumber));
                              }}
                              onNumberChange={(n) => {
                                setColPhoneNumber(n);
                                updateForm("phone", joinPhone(colPhoneCountryCode, n));
                              }}
                              required
                            />
                          </div>
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
                      </>
                    )}
                    {/* Date picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ck-col-date">
                          <CalendarDays className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                          Collection Date
                        </Label>
                        <Input
                          id="ck-col-date"
                          type="date"
                          value={deliveryForm.preferredDate}
                          min={minDate}
                          onChange={(e) => updateForm("preferredDate", e.target.value)}
                          required
                          className={`cursor-pointer ${(() => {
                            const iso = deliveryForm.preferredDate;
                            if (!iso) return "";
                            const [y, m, d] = iso.split("-").map(Number);
                            const date = new Date(y, m - 1, d);
                            return (blockedDays.includes(date.getDay()) || blockedDates.includes(iso))
                              ? "border-destructive"
                              : "";
                          })()}`}
                        />
                        {(() => {
                          const iso = deliveryForm.preferredDate;
                          if (!iso) return null;
                          const [y, m, d] = iso.split("-").map(Number);
                          const date = new Date(y, m - 1, d);
                          const isBlocked = blockedDays.includes(date.getDay()) || blockedDates.includes(iso);
                          return isBlocked ? (
                            <p className="text-xs text-destructive">This date is unavailable. Please select another.</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{formatDateLabel(iso)}</p>
                          );
                        })()}
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
                          <p className="font-medium text-sm">
                            {deliveryType === "DELIVERY" ? "Cash on Delivery" : "Cash on Collection"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deliveryType === "DELIVERY" ? "Pay when your order arrives" : "Pay when you collect"}
                          </p>
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
                  ) : selectedPaymentMethod === "CASH" ? (
                    <>Place Order <ArrowRight className="ml-2 h-4 w-4" /></>
                  ) : (
                    <>Continue to Payment <ArrowRight className="ml-2 h-4 w-4" /></>
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
                {discountAmount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount ({discountCode})</span>
                    <span>-{formatPrice(discountAmount, currency.code, currency.locale)}</span>
                  </div>
                )}
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
