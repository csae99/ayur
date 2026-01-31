'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VisionAssessmentPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [analysisType, setAnalysisType] = useState<'face' | 'tongue' | 'skin'>('face');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        // Cleanup camera stream on unmount
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setShowCamera(true);
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Unable to access camera. Please allow camera permissions.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setImagePreview(imageData);
                setResult(null);
            }
        }
        stopCamera();
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const analyzeImage = async () => {
        if (!imagePreview) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost/api/bot/vision-assessment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imagePreview,
                    analysis_type: analysisType
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearImage = () => {
        setImagePreview(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getDoshaColor = (dosha: string) => {
        switch (dosha.toLowerCase()) {
            case 'vata': return 'bg-purple-500';
            case 'pitta': return 'bg-orange-500';
            case 'kapha': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard/patient/ayurbot')}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-camera text-white"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Visual Dosha Assessment</h1>
                            <p className="text-xs text-gray-500">AI-powered analysis using Ayurvedic principles</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Upload Section */}
                    <div className="space-y-6">
                        {/* Analysis Type Selection */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                <i className="fas fa-list-ul text-green-500 mr-2"></i>
                                Select Analysis Type
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {(['face', 'tongue', 'skin'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setAnalysisType(type)}
                                        className={`px-4 py-3 rounded-xl font-medium capitalize transition-all ${analysisType === type
                                                ? 'bg-green-500 text-white shadow-lg'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type === 'face' && '😊'}
                                        {type === 'tongue' && '👅'}
                                        {type === 'skin' && '✋'}
                                        <span className="ml-2">{type}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-3">
                                {analysisType === 'face' && 'AI will analyze facial structure, skin texture, and complexion'}
                                {analysisType === 'tongue' && 'AI will analyze tongue coating, color, and moisture'}
                                {analysisType === 'skin' && 'AI will analyze skin texture, oiliness, and tone'}
                            </p>
                        </div>

                        {/* Image Upload/Camera */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                <i className="fas fa-image text-blue-500 mr-2"></i>
                                Upload or Capture Photo
                            </h2>

                            {showCamera ? (
                                <div className="space-y-4">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full rounded-xl"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={capturePhoto}
                                            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                                        >
                                            <i className="fas fa-camera mr-2"></i>
                                            Capture
                                        </button>
                                        <button
                                            onClick={stopCamera}
                                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : imagePreview ? (
                                <div className="space-y-4">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full rounded-xl object-cover max-h-64"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={analyzeImage}
                                            disabled={loading}
                                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-search mr-2"></i>
                                                    Analyze for Dosha
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={clearImage}
                                            className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
                                    >
                                        <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3"></i>
                                        <p className="text-gray-600">Click to upload an image</p>
                                        <p className="text-sm text-gray-400">or drag and drop</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={startCamera}
                                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                                    >
                                        <i className="fas fa-camera mr-2"></i>
                                        Use Camera
                                    </button>
                                </div>
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="space-y-6">
                        {result ? (
                            <>
                                {/* Dosha Breakdown */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                        <i className="fas fa-chart-pie text-purple-500 mr-2"></i>
                                        Dosha Indicators
                                    </h2>

                                    <div className="text-center mb-6">
                                        <div className={`inline-block px-6 py-2 rounded-full text-white font-bold text-lg ${getDoshaColor(result.primary_dosha)}`}>
                                            Primary: {result.primary_dosha}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {['vata', 'pitta', 'kapha'].map((dosha) => (
                                            <div key={dosha} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium capitalize">{dosha}</span>
                                                    <span className="text-gray-600">{result.dosha_indicators[dosha]}%</span>
                                                </div>
                                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${getDoshaColor(dosha)} transition-all duration-500`}
                                                        style={{ width: `${result.dosha_indicators[dosha]}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Observations */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                        <i className="fas fa-eye text-blue-500 mr-2"></i>
                                        Observations
                                    </h2>
                                    <ul className="space-y-2">
                                        {result.observations.map((obs: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                                                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                                                <span>{obs}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Recommendations */}
                                <div className="bg-white rounded-2xl p-6 shadow-lg">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                                        <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                                        Recommendations
                                    </h2>
                                    <ul className="space-y-2">
                                        {result.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-gray-700">
                                                <i className="fas fa-arrow-right text-green-500 mt-1"></i>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
                                <i className="fas fa-leaf text-6xl text-green-200 mb-4"></i>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload a Photo</h3>
                                <p className="text-gray-500">
                                    Upload or capture a {analysisType} photo to receive your personalized dosha analysis
                                </p>
                                <div className="mt-6 p-4 bg-yellow-50 rounded-xl">
                                    <p className="text-sm text-yellow-700">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        For best results, use a clear, well-lit photo with good focus
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="bg-gray-100 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-500">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                This AI analysis is for informational purposes only and should not replace professional medical advice.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
