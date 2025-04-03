import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { claimItem } from "../services/itemService";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";

const Claim = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    qrCode: null
  });
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleQRCodeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          qrCode: event.target.result
        }));
        setError(''); // Clear any previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.email) {
      toast.error("Please enter your email");
      return false;
    }
    if (!formData.phone) {
      toast.error("Please enter your phone number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Create FormData object
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      
      // Add QR code if it exists
      if (formData.qrCode) {
        // Convert base64 to blob
        const base64Data = formData.qrCode.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/png' });
        submitData.append('qrCode', blob, 'qr-code.png');
      }

      const response = await claimItem(submitData);
      
      if (response.success) {
        setSuccess(true);
        setQrData(response.qrData);
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          qrCode: null
        });
        toast.success("Item claimed successfully!");
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error submitting claim");
      toast.error(err.response?.data?.message || "Error submitting claim");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `claim-qr-${formData.itemId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          {/* Header */}
          <div className="w-full max-w-5xl text-center mb-12">
            <div className="border-4 border-black mb-4 mt-10"></div>
            <h1 className="text-7xl font-bold text-black mb-4">Make a Claim</h1>
            <div className="border-4 border-black"></div>
          </div>

          {/*Claim box container*/}
          <div className="w-full max-w-7xl mx-auto px-8 relative">
            {/*Red Accent Bar*/}
            <div className="absolute right-6.5 top-0 bottom-12 w-[30px] bg-[#e2231a]"></div>
            <div className="relative right-0 top-0 left-223 h-[30px] w-[300px] bg-[#e2231a]"></div>

            {/* Form Section */}
            <div className="max-w-7xl mx-auto w-full px-6 pb-12">
              <div className="relative">
                {/* Form */}
                <div className="bg-black text-white p-8 pr-16">
                  {error && (
                    <div className="bg-red-600 text-white p-4 mb-6 rounded">
                      {error}
                    </div>
                  )}
                  
                  {success ? (
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-green-600 mb-4">Claim Submitted Successfully!</h3>
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <QRCodeSVG value={JSON.stringify(qrData)} size={200} />
                        <p className="mt-4 text-gray-600">Please present this QR code to the admin to complete your claim.</p>
                      </div>
                      <button
                        onClick={() => setSuccess(false)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Submit Another Claim
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Form Title */}
                      <div className="max-w-7xl mx-auto w-full px-6 py-4">
                        <div className="relative py-4 px-8">
                          <h2 className="text-2xl font-bold">
                            Make your claim and <br />
                            retrieve your QR code
                          </h2>
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black"></div>
                        </div>
                      </div>

                      <div className="px-12">
                        <label className="block mb-2">Name</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <input
                              type="text"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-[400px] bg-white rounded border border-white text-black px-3 py-2"
                              placeholder="First name"
                              required
                            />
                            <span className="text-xs mt-1 text-[#a9a9a9] block">
                              First name
                            </span>
                          </div>
                          <div>
                            <input
                              type="text"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-[400px] bg-white rounded border border-white text-black px-3 py-2"
                              placeholder="Last name"
                              required
                            />
                            <span className="text-xs mt-1 text-[#a9a9a9] block">
                              Last name
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-12">
                        <label className="block mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-[400px] bg-white rounded border border-white text-black px-3 py-2"
                          placeholder="Enter your email address"
                          required
                        />
                        <span className="text-xs mt-1 text-[#a9a9a9] block">
                          Enter the email address where you received the QR code
                        </span>
                      </div>

                      <div className="px-12">
                        <label className="block mb-2">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-[400px] bg-white rounded border border-white text-black px-3 py-2"
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>

                      <div className="px-12">
                        <label className="block text-sm font-medium text-gray-700">Upload QR Code from Email</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              stroke="currentColor"
                              fill="none"
                              viewBox="0 0 48 48"
                              aria-hidden="true"
                            >
                              <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="qr-code"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                              >
                                <span>Upload QR code</span>
                                <input
                                  id="qr-code"
                                  name="qr-code"
                                  type="file"
                                  accept="image/*"
                                  onChange={handleQRCodeUpload}
                                  className="sr-only"
                                  required
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                        {formData.qrCode && (
                          <div className="mt-2 text-sm text-green-600">
                            QR code uploaded successfully
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center pt-4 px-100">
                        <button
                          type="submit"
                          disabled={loading}
                          className="bg-[#e2231a] hover:bg-[#c2231a] text-white px-12 py-2 rounded cursor-pointer transition-colors duration-200 w-full disabled:opacity-50"
                        >
                          {loading ? "Processing..." : "Verify"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Claim;
