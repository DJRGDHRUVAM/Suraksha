"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [showModal, setShowModal] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPolice, setShowPolice] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showLocalAgent, setShowLocalAgent] = useState(false);
  const [agentRequestType, setAgentRequestType] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [videoStream, setVideoStream] = useState(null);
  const [videoRecorder, setVideoRecorder] = useState(null);
  const [videoChunks, setVideoChunks] = useState([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("");
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCopChat, setShowCopChat] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState("");
  const [message, setMessage] = useState(
    "Help! I'm in an emergency situation. Here's my location:"
  );
  const [location, setLocation] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pairedDevice, setPairedDevice] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("");
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "This is Officer Deepa from the Virtual Police Department. I'm here to assist you with any safety concerns or emergencies. How can I help you today?",
    },
  ]);

  useEffect(() => {
    const savedContacts = localStorage.getItem("contacts");
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);

    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [isTimerRunning]);

  const startRecording = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setAudioStream(audioStream);
      setVideoStream(videoStream);
      setIsTimerRunning(true);

      const audioRecorder = new MediaRecorder(audioStream);
      const videoRecorder = new MediaRecorder(videoStream);

      setMediaRecorder(audioRecorder);
      setVideoRecorder(videoRecorder);

      audioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, event.data]);
        }
      };

      videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setVideoChunks((chunks) => [...chunks, event.data]);
        }
      };

      audioRecorder.onerror = (event) => {
        console.error("Recording error: WOMP WOMP HAHAHAHAHAH", event.error);
        setRecordingStatus("Error during recording. Please try again.");
        stopRecording();
      };

      videoRecorder.onerror = (event) => {
        console.error("Video recording error: L TBH", event.error);
        setRecordingStatus("Error during video recording. Please try again.");
        stopRecording();
      };

      audioRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const videoBlob = new Blob(videoChunks, { type: "video/webm" });

          if (navigator.onLine) {
            const [upload, { loading }] = useUpload();
            const audioResult = await upload({ file: audioBlob });
            const videoResult = await upload({ file: videoBlob });

            if (audioResult.error || videoResult.error) {
              throw new Error(audioResult.error || videoResult.error);
            }

            setRecordingStatus("Recordings saved successfully!");
            contacts.forEach((contact) => {
              const whatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(
                `Emergency Audio Recording: ${audioResult.url}`
              )}`;
              const videoWhatsappUrl = `https://wa.me/${contact}?text=${encodeURIComponent(
                `Emergency Video Recording: ${videoResult.url}`
              )}`;
              window.open(whatsappUrl, "_blank");
              window.open(videoWhatsappUrl, "_blank");
              console.log(
                `Sending recordings to WhatsApp contact ${contact}: Audio - ${audioResult.url}, Video - ${videoResult.url}`
              );
            });
          } else {
            const recordings = JSON.parse(
              localStorage.getItem("offlineRecordings") || "[]"
            );
            const timestamp = new Date().toISOString();
            recordings.push({
              audioBlob,
              videoBlob,
              timestamp,
            });
            localStorage.setItem(
              "offlineRecordings",
              JSON.stringify(recordings)
            );
            setRecordingStatus("Recordings saved locally (offline mode)");
          }
        } catch (error) {
          console.error("Error processing recordings I HATE MY LIFE:", error);
          setRecordingStatus("Error saving recordings. Please try again.");
        }
      };

      audioRecorder.start(1000);
      videoRecorder.start(1000);
      setIsRecording(true);
      setRecordingStatus("Recording started...");
    } catch (error) {
      console.error("Error starting recording I SHOULD HAVE CHOSEN COMMERCE:", error);
      setRecordingStatus("Error starting recording. Please check permissions.");
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && videoRecorder && isRecording) {
      mediaRecorder.stop();
      videoRecorder.stop();
      audioStream.getTracks().forEach((track) => track.stop());
      videoStream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsTimerRunning(false);
      setTimer(0);
      setAudioStream(null);
      setVideoStream(null);
      setMediaRecorder(null);
      setVideoRecorder(null);
      setAudioChunks([]);
      setVideoChunks([]);
    }
  };

  const handleLocationAndAlert = () => {
    if (!navigator.onLine) {
      alert(
        "You are currently offline. Emergency services will be contacted when you're back online."
      );
      return;
    }
    window.location.href = "tel:100";
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
          setLocation(locationUrl);
          const fullMessage = `${message} ${locationUrl}`;
          contacts.forEach((contact) => {
            const smsLink = `sms:${contact}?body=${encodeURIComponent(
              fullMessage
            )}`;
            try {
              window.open(smsLink, "_blank");
            } catch (error) {
              console.error("Error sending SMS MAN WHY AM I LIKE THIS:", error);
            }
          });
        },
        (error) => {
          console.error("Error getting location: CHURCH IS THE NEW CLUB", error);
          setRecordingStatus(
            "Error getting location. Please check permissions."
          );
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    setShowModal(true);
    setShowAudio(true);
    setShowLocation(true);
    startRecording();
    alert("Emergency alert sent! Help is on the way.");
  };

  const handlePurchase = () => {
    if (address && payment) {
      setOrderConfirmed(true);
    }
  };
  const handleSaveContact = () => {
    if (newContact) {
      setContacts([...contacts, newContact]);
      setNewContact("");
      setShowContacts(false);
    }
  };

  const handleAssistantMessage = async () => {
    if (!assistantMessage.trim()) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: assistantMessage },
    ]);

    const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are Officer Deepa, a helpful and professional police officer. Your responses should be clear, authoritative, and focused on safety. Use a formal yet approachable tone, and always prioritize the user's wellbeing. If you detect any emergency situations, immediately recommend contacting emergency services.",
          },
          ...messages,
          { role: "user", content: assistantMessage },
        ],
      }),
    });
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    const dangerKeywords = [
      "help",
      "danger",
      "emergency",
      "hurt",
      "injured",
      "attack",
      "scared",
      "threat",
      "unsafe",
    ];
    const isDanger = dangerKeywords.some((keyword) =>
      assistantMessage.toLowerCase().includes(keyword)
    );

    if (isDanger) {
      if (navigator.onLine) {
        window.location.href = "tel:100";
        handleLocationAndAlert();
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: navigator.onLine
            ? "This is Officer Deepa. I've detected a potential emergency situation. I'm initiating emergency services (100) and activating SOS protocols. Stay where you are, help is coming. Keep calm and stay on the line."
            : "This is Officer Deepa. I've detected a potential emergency, but you appear to be offline. Please find a secure internet connection or dial emergency services directly at 100.",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    }

    setAssistantMessage("");
    localStorage.setItem("messages", JSON.stringify(messages));
  };

  const handleLocalAgentRequest = (type) => {
    setAgentRequestType(type);
    if (type === "emergency") {
      window.location.href = "tel:9567610069";
      alert(
        "Your request has been recorded successfully. Customer care support will reach you within 4 minutes. You are protected, even in offline mode."
      );
    } else {
      window.location.href = "tel:8078937455";
      alert(
        "You will receive a call from our customer care support within 25 minutes."
      );
    }
    setShowLocalAgent(false);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4">
      <div className="fixed top-4 left-4 bg-[#dc3545] text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="text-xl font-bold">
          {currentTime.toLocaleTimeString()}
        </div>
      </div>
      {!navigator.onLine && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4"
          role="alert"
        >
          <p className="font-bold">Offline Mode</p>
          <p>Some features may be limited until you're back online.</p>
        </div>
      )}
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#dc3545] font-roboto">
            SURAKSHA
          </h1>
          <p className="text-[#6c757d] mt-2 font-crimson-text">
            Welcome to Suraksha!
          </p>
          <p className="text-[#6c757d] mt-2 font-crimson-text">
            Your Safety, Our Priority
          </p>
        </header>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button
            onClick={handleLocationAndAlert}
            className="w-full h-32 bg-[#dc3545] hover:bg-[#c82333] rounded-full flex items-center justify-center mb-4 transition-transform transform hover:scale-105"
          >
            <i className="fas fa-exclamation-triangle text-4xl text-white"></i>
          </button>
          <p className="text-center text-[#6c757d] font-crimson-text">
            Tap SOS for Emergency
          </p>
        </div>
        {isTimerRunning && (
          <div className="fixed top-4 right-4 bg-[#dc3545] text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="text-xl font-bold">{formatTime(timer)}</div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 font-roboto">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowLocation(true)}
              className="p-4 bg-[#007bff] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-location-dot mb-2"></i>
              <span className="font-crimson-text">Share Location</span>
            </button>
            <button
              onClick={() => setShowContacts(true)}
              className="p-4 bg-[#28a745] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-address-book mb-2"></i>
              <span className="font-crimson-text">Contacts</span>
            </button>
            <button
              onClick={() => setShowAudio(true)}
              className="p-4 bg-[#6c757d] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-microphone mb-2"></i>
              <span className="font-crimson-text">Live Audio</span>
            </button>
            <button
              onClick={() => setShowPolice(true)}
              className="p-4 bg-[#ffc107] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-building-shield mb-2"></i>
              <span className="font-crimson-text">Police Station</span>
            </button>
            <button
              onClick={() =>
                (window.location.href =
                  "https://maps.google.com/maps?client=tablet-android-samsung-ss&sca_esv=a07f0383584960a3&output=search&q=hospitals+near+me&source=lnms&fbs=AEQNm0Aa4sjWe7Rqy32pFwRj0UkW1DRbm01j6DCVS0r1sTxn7h_rt6mVhwDmwtd3hPZjM8zl8B526v4C-56SyLN7G5Ea5Ep4L_RY1VmXS_R41aXeU5ajFjmBsr765NPF6RJN6O7njII9jgXbsbL1DG9cJQBc410Dq-w5sv57LBjzemycfTkAbzAHMoCtAmHMrb1HASToNnGGXes4iNBRGvHnlBtH3DHk_A&entry=mc&ved=1t:200715&ictx=111")
              }
              className="p-4 bg-[#e83e8c] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-hospital mb-2"></i>
              <span className="font-crimson-text">Health</span>
            </button>
            <button
              onClick={() => setShowPurchase(true)}
              className="p-4 bg-[#20c997] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-shopping-cart mb-2"></i>
              <span className="font-crimson-text">Buy Wristband</span>
            </button>
            <button
              onClick={() => {
                setShowVideo(true);
                startRecording();
              }}
              className="p-4 bg-[#dc3545] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-video mb-2"></i>
              <span className="font-crimson-text">Live Video</span>
            </button>
            <button
              onClick={() => setShowCopChat(true)}
              className="p-4 bg-[#1e3a8a] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-user-police mb-2"></i>
              <span className="font-crimson-text">Talk to a Cop</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-4 bg-[#17a2b8] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-gear mb-2"></i>
              <span className="font-crimson-text">Settings</span>
            </button>
            <button
              onClick={() => setShowAssistant(true)}
              className="p-4 bg-[#6f42c1] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-robot mb-2"></i>
              <span className="font-crimson-text">AI Assistant</span>
            </button>
            <button
              onClick={() => (window.location.href = "tel:8793088814")}
              className="p-4 bg-[#9c27b0] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-phone mb-2"></i>
              <span className="font-crimson-text">Womanline Support</span>
            </button>
            <button
              onClick={() => setShowLocalAgent(true)}
              className="p-4 bg-[#4a5568] text-white rounded-lg flex flex-col items-center"
            >
              <i className="fas fa-headset mb-2"></i>
              <span className="font-crimson-text">Talk to Local Agent</span>
            </button>
          </div>
        </div>
      </div>

      {showLocalAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Contact Support
            </h2>
            <p className="text-[#6c757d] mb-4 font-crimson-text">
              Would you like to contact customer care support for an emergency
              or during free time?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLocalAgentRequest("emergency")}
                className="flex-1 bg-[#dc3545] text-white py-2 rounded-lg"
              >
                Emergency
              </button>
              <button
                onClick={() => handleLocalAgentRequest("free-time")}
                className="flex-1 bg-[#28a745] text-white py-2 rounded-lg"
              >
                Free Time
              </button>
            </div>
            <button
              onClick={() => setShowLocalAgent(false)}
              className="w-full bg-[#6c757d] text-white py-2 rounded-lg mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showCopChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Talk to Officer Deepa
            </h2>
            <div className="h-64 overflow-y-auto mb-4 bg-gray-50 p-4 rounded">
              <div className="text-[#1e3a8a] mb-4">
                <strong>👮‍♂️ Officer Deepa:</strong> Hello, I'm Officer Deepa.
                How can I assist you today? If this is an emergency, please use
                the SOS button or dial 100 immediately.
              </div>
              {messages
                .filter((msg) => showCopChat)
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 ${
                      msg.role === "assistant"
                        ? "text-[#1e3a8a]"
                        : "text-[#28a745]"
                    }`}
                  >
                    <strong>
                      {msg.role === "assistant"
                        ? "👮‍♂️ Officer Deepa: "
                        : "👤 You: "}
                    </strong>
                    {msg.content}
                  </div>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={assistantMessage}
                onChange={(e) => setAssistantMessage(e.target.value)}
                placeholder="Type your message to Officer Deepa..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleAssistantMessage}
                className="bg-[#1e3a8a] text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
            <button
              onClick={() => setShowCopChat(false)}
              className="w-full bg-[#6c757d] text-white py-2 rounded-lg mt-4"
            >
              End Chat
            </button>
          </div>
        </div>
      )}

      {showPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Purchase Safety Wristband
            </h2>
            {!orderConfirmed ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select payment method</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="upi">UPI</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePurchase}
                    disabled={!address || !payment}
                    className="flex-1 bg-[#20c997] text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Confirm Order
                  </button>
                  <button
                    onClick={() => setShowPurchase(false)}
                    className="flex-1 bg-[#6c757d] text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <i className="fas fa-check-circle text-[#20c997] text-4xl mb-4"></i>
                <p className="mb-4">
                  Your order will be delivered within 2 days to:
                </p>
                <p className="font-medium mb-4">{address}</p>
                <button
                  onClick={() => {
                    setShowPurchase(false);
                    setOrderConfirmed(false);
                    setAddress("");
                    setPayment("");
                  }}
                  className="w-full bg-[#20c997] text-white py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Sending SOS Alert
            </h2>
            <p className="text-[#6c757d] mb-4 font-crimson-text">
              Alerting your emergency contacts with your location...
            </p>
            {location && (
              <p className="text-[#28a745] mb-4 font-crimson-text">
                Location shared successfully!
              </p>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-[#dc3545] text-white py-2 rounded-lg"
            >
              Cancel Alert
            </button>
          </div>
        </div>
      )}

      {showAudio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Live Audio Recording
            </h2>
            <div className="flex justify-center items-center h-24">
              {isRecording && (
                <>
                  <div className="w-4 h-16 bg-[#dc3545] mx-1 animate-pulse"></div>
                  <div className="w-4 h-24 bg-[#dc3545] mx-1 animate-pulse"></div>
                  <div className="w-4 h-16 bg-[#dc3545] mx-1 animate-pulse"></div>
                </>
              )}
            </div>
            <p className="text-[#6c757d] text-center mb-4 font-crimson-text">
              {recordingStatus ||
                (isRecording
                  ? "Recording in progress..."
                  : "Recording stopped")}
            </p>
            <button
              onClick={() => {
                stopRecording();
                setShowAudio(false);
              }}
              className="w-full bg-[#dc3545] text-white py-2 rounded-lg"
            >
              Stop Recording
            </button>
          </div>
        </div>
      )}

      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Live Video Recording
            </h2>
            {videoStream && (
              <video
                autoPlay
                playsInline
                muted
                className="w-full h-48 bg-black rounded-lg mb-4"
                ref={(video) => {
                  if (video && videoStream) {
                    video.srcObject = videoStream;
                  }
                }}
              />
            )}
            <p className="text-[#6c757d] text-center mb-4 font-crimson-text">
              {recordingStatus ||
                (isRecording
                  ? "Recording in progress..."
                  : "Recording stopped")}
            </p>
            <button
              onClick={() => {
                stopRecording();
                setShowVideo(false);
              }}
              className="w-full bg-[#dc3545] text-white py-2 rounded-lg"
            >
              Stop Recording
            </button>
          </div>
        </div>
      )}

      {showLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Share Location
            </h2>
            <p className="text-[#6c757d] mb-4 font-crimson-text">
              Sharing your current location...
            </p>
            <button
              onClick={() => setShowLocation(false)}
              className="w-full bg-[#007bff] text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showContacts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Emergency Contacts
            </h2>
            <div className="mb-4">
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                placeholder="Add new contact"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveContact}
                className="flex-1 bg-[#28a745] text-white py-2 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setShowContacts(false)}
                className="flex-1 bg-[#6c757d] text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              <h3 className="font-bold mb-2">Your Emergency Contacts:</h3>
              {contacts.map((contact, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded mb-2">
                  {contact}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">Settings</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Enable Notifications</span>
                <input type="checkbox" />
              </div>
              <div className="flex justify-between items-center">
                <span>Dark Mode</span>
                <input type="checkbox" />
              </div>
              <div className="flex justify-between items-center">
                <span>Pair Wristband/Bluetooth Device</span>
                <button
                  onClick={async () => {
                    if (navigator.bluetooth) {
                      try {
                        const device = await navigator.bluetooth.requestDevice({
                          filters: [
                            {
                              services: ["heart_rate"],
                            },
                          ],
                          optionalServices: ["battery_service"],
                        });
                        const server = await device.gatt.connect();
                        setPairedDevice(device);
                        alert(`Successfully paired with ${device.name}`);
                      } catch (error) {
                        if (error.name === "NotFoundError") {
                          alert("No compatible Bluetooth devices found nearby");
                        } else if (error.name === "SecurityError") {
                          alert("Bluetooth permission denied");
                        } else {
                          alert("Failed to pair: " + error.message);
                        }
                      }
                    } else {
                      alert("Bluetooth is not supported on this device");
                    }
                  }}
                  className="bg-[#007bff] text-white px-3 py-1 rounded-lg text-sm"
                >
                  {pairedDevice ? "Connected" : "Pair"}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-[#17a2b8] text-white py-2 rounded-lg mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPolice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">
              Nearest Police Station
            </h2>
            <p className="text-[#6c757d] mb-4 font-crimson-text">
              Click below to find nearby police stations
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  (window.location.href =
                    "https://maps.google.com/maps?client=tablet-android-samsung-ss&sca_esv=a07f0383584960a3&output=search&q=nearby+police+station&source=lnms&fbs=AEQNm0Aa4sjWe7Rqy32pFwRj0UkW1DRbm01j6DCVS0r1sTxn7h_rt6mVhwDmwtd3hPZjM8zl8B526v4C-56SyLN7G5Ea5Ep4L_RY1VmXS_R41aXeU5ajFjmBsr765NPF6RJN6O7njII9jgXbsbL1DG9cJQBc410Dq-w5sv57LBjzemycfTkAbzAHMoCtAmHMrb1HASToNnGGXes4iNBRGvHnlBtH3DHk_A&entry=mc&ved=1t:200715&ictx=111")
                }
                className="flex-1 bg-[#28a745] text-white py-2 rounded-lg"
              >
                Open Maps
              </button>
              <button
                onClick={() => setShowPolice(false)}
                className="flex-1 bg-[#ffc107] text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4 font-roboto">AI Assistant</h2>
            <div className="h-64 overflow-y-auto mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-2 ${
                    msg.role === "assistant"
                      ? "text-[#6f42c1]"
                      : "text-[#28a745]"
                  }`}
                >
                  <strong>
                    {msg.role === "assistant" ? "🤖 Assistant: " : "👤 You: "}
                  </strong>
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={assistantMessage}
                onChange={(e) => setAssistantMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={handleAssistantMessage}
                className="bg-[#6f42c1] text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
            <button
              onClick={() => setShowAssistant(false)}
              className="w-full bg-[#6c757d] text-white py-2 rounded-lg mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;