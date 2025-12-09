import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { car } = location.state || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [billingInfo, setBillingInfo] = useState({
    name: "",
    address: "",
    phone: "",
    city: "",
  });
  const [rentalInfo, setRentalInfo] = useState({
    pickup: { location: "", date: "", time: "" },
    dropoff: { location: "", date: "", time: "" },
  });
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvc: "",
  });
  const [agreements, setAgreements] = useState({
    marketing: false,
    terms: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!car) {
      navigate("/");
    }
  }, [car, navigate]);

  const calculateTotal = () => {
    if (!car) return 0;
    const price = car.gia_thue || car.gia_khuyen_mai || car.gia || 0;
    return price;
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreements.terms) {
      alert("Vui lòng đồng ý với điều khoản và chính sách");
      return;
    }

    setLoading(true);
    try {
      const days = rentalInfo.pickup.date && rentalInfo.dropoff.date
        ? Math.ceil(
            (new Date(rentalInfo.dropoff.date) - new Date(rentalInfo.pickup.date)) /
              (1000 * 60 * 60 * 24)
          )
        : 1;

      const orderData = {
        items: [{
          xe_id: car.ma_xe || car.id,
          quantity: 1,
        }],
        shipping_name: billingInfo.name,
        shipping_phone: billingInfo.phone,
        shipping_address: billingInfo.address,
        shipping_city: billingInfo.city,
        start_date: rentalInfo.pickup.date,
        end_date: rentalInfo.dropoff.date,
        pickup_location: rentalInfo.pickup.location,
        return_location: rentalInfo.dropoff.location,
        rental_days: days,
        payment_method: paymentMethod,
      };

      const response = await axiosClient.post("order/", orderData);
      
      await axiosClient.post("checkout/", {
        order_id: response.data.id,
        payment_method: paymentMethod,
        payment_info: paymentInfo,
      });

      alert("Thanh toán thành công!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Có lỗi xảy ra khi thanh toán");
    } finally {
      setLoading(false);
    }
  };

  if (!car) {
    return null;
  }

  const price = calculateTotal();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Billing Info */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-2">Billing Info</h2>
              <p className="text-gray-600 mb-6">Please enter your billing info</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                    placeholder="Address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Town / City</label>
                  <input
                    type="text"
                    value={billingInfo.city}
                    onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                    placeholder="Town or city"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Rental Info */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-2">Rental Info</h2>
              <p className="text-gray-600 mb-6">Please select your rental date</p>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center mb-4">
                    <input
                      type="radio"
                      checked={true}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label className="ml-2 font-semibold">Pick-Up</label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Locations</label>
                      <select
                        value={rentalInfo.pickup.location}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            pickup: { ...rentalInfo.pickup, location: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>Select your city</option>
                        <option>Semarang</option>
                        <option>Jakarta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Date</label>
                      <input
                        type="date"
                        value={rentalInfo.pickup.date}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            pickup: { ...rentalInfo.pickup, date: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Time</label>
                      <select
                        value={rentalInfo.pickup.time}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            pickup: { ...rentalInfo.pickup, time: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>Select your time</option>
                        <option>07.00</option>
                        <option>08.00</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center mb-4">
                    <input
                      type="radio"
                      checked={false}
                      className="w-4 h-4 text-blue-600"
                    />
                    <label className="ml-2 font-semibold">Drop-Off</label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 ml-6">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Locations</label>
                      <select
                        value={rentalInfo.dropoff.location}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            dropoff: { ...rentalInfo.dropoff, location: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>Select your city</option>
                        <option>Semarang</option>
                        <option>Jakarta</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Date</label>
                      <input
                        type="date"
                        value={rentalInfo.dropoff.date}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            dropoff: { ...rentalInfo.dropoff, date: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Time</label>
                      <select
                        value={rentalInfo.dropoff.time}
                        onChange={(e) =>
                          setRentalInfo({
                            ...rentalInfo,
                            dropoff: { ...rentalInfo.dropoff, time: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>Select your time</option>
                        <option>01.00</option>
                        <option>02.00</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
              <p className="text-gray-600 mb-6">Please enter your payment method</p>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center p-4 border-2 border-blue-600 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      value="credit_card"
                      checked={paymentMethod === "credit_card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 font-semibold">Credit Card</span>
                    <div className="ml-auto flex space-x-2">
                      <span className="text-sm">VISA</span>
                      <span className="text-sm">Mastercard</span>
                    </div>
                  </label>
                </div>
                {paymentMethod === "credit_card" && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        value={paymentInfo.cardNumber}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })
                        }
                        placeholder="Card number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder</label>
                      <input
                        type="text"
                        value={paymentInfo.cardHolder}
                        onChange={(e) =>
                          setPaymentInfo({ ...paymentInfo, cardHolder: e.target.value })
                        }
                        placeholder="Cardholder"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                        <input
                          type="text"
                          value={paymentInfo.expiryDate}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, expiryDate: e.target.value })
                          }
                          placeholder="DD/MM/YY"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                        <input
                          type="text"
                          value={paymentInfo.cvc}
                          onChange={(e) =>
                            setPaymentInfo({ ...paymentInfo, cvc: e.target.value })
                          }
                          placeholder="CVC"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                    <input
                      type="radio"
                      value="paypal"
                      checked={paymentMethod === "paypal"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 font-semibold">PayPal</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-600">
                    <input
                      type="radio"
                      value="bitcoin"
                      checked={paymentMethod === "bitcoin"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-3 font-semibold">Bitcoin</span>
                  </label>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-2">Confirmation</h2>
              <p className="text-gray-600 mb-6">
                We are getting to the end. Just few clicks and your rental is ready!
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.marketing}
                      onChange={(e) =>
                        setAgreements({ ...agreements, marketing: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I agree with sending an Marketing and newsletter emails. No spam, promissed!
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreements.terms}
                      onChange={(e) =>
                        setAgreements({ ...agreements, terms: e.target.checked })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded"
                      required
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      I agree with our terms and conditions and privacy policy.
                    </span>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || !agreements.terms}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
                >
                  {loading ? "Processing..." : "Rent Now"}
                </button>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="font-semibold">All your data are safe</p>
                    <p className="text-xs">
                      We are using the most advanced security to provide you the best experience ever.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                  >
                    Back
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Side - Rental Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-2">Rental Summary</h2>
            <p className="text-sm text-gray-600 mb-6">
              Prices may change depending on the length of the rental and the price of your rental car.
            </p>
            
            <div className="mb-6">
              <img
                src={car.image_url || "/images/img_car.png"}
                alt={car.ten_xe}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-lg">{car.ten_xe}</h3>
              <div className="flex items-center space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < 4 ? "text-yellow-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm text-gray-600 ml-1">440+ Reviewer</span>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">${(price / 23000).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">$0</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="Apply promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold">
                    Apply now
                  </button>
                </div>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">${(price / 23000).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">Overall price and includes rental discount</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
