import { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

// Helper to load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function RazorpayCheckout({ 
  paymentData, 
  user, 
  onSuccess, 
  onError, 
  onClose,
  isProcessing 
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt to pre-load script when component mounts
    loadRazorpayScript();
  }, []);

  const handlePayment = async () => {
    if (!paymentData || !paymentData.id) {
      addToast('Invalid payment session data', 'error');
      return;
    }

    setLoading(true);
    const isLoaded = await loadRazorpayScript();
    
    if (!isLoaded) {
      addToast('Failed to load Razorpay SDK. Please check your internet connection.', 'error');
      setLoading(false);
      if (onError) onError(new Error('SDK load failed'));
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: paymentData.amount, 
      currency: paymentData.currency,
      name: 'Smart Restaurant Ecosystem',
      description: 'Order Payment',
      // image: 'url_to_logo_if_any',
      order_id: paymentData.id, 
      handler: function (response) {
        // Success handler
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: '', // we don't have phone in user model currently
      },
      theme: {
        color: '#E2571D', // Our ember color
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          if (onClose) onClose();
        },
      },
    };

    const rzp1 = new window.Razorpay(options);
    
    rzp1.on('payment.failed', function (response) {
      setLoading(false);
      addToast('Payment Failed. Please try again.', 'error');
      if (onError) onError(response.error);
    });

    rzp1.open();
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing || loading}
      className={`w-full bg-ember hover:bg-ember/90 text-white font-bold py-3 px-4 rounded-xl shadow-hero transition-all flex items-center justify-center gap-2 ${
        isProcessing || loading ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'
      }`}
    >
      {(isProcessing || loading) ? (
        <>
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Opening Secure Payment...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Pay Securely with Razorpay
        </>
      )}
    </button>
  );
}
