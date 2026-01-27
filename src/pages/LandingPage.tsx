import React from 'react';

interface LandingPageProps {
    onLoginClick: () => void;
    onGuestBooking: () => void;
    onGuestTracking: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onGuestBooking, onGuestTracking }) => {
    return (
        <div className="min-h-screen bg-white font-display">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <span className="material-symbols-outlined text-white text-xl">build</span>
                            </div>
                            <div>
                                <span className="font-bold text-xl text-gray-900">Bengkel Kang Acep</span>
                                <div className="text-xs text-gray-500">Spesialis Motor & Mobil</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={onGuestTracking}
                                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">search</span>
                                Lacak Servis
                            </button>
                            <button
                                onClick={onLoginClick}
                                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                            >
                                Akses Staff
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
                            Bengkel Terpercaya <br />
                            <span className="text-primary">Sejak 1995</span>
                        </h1>
                        <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-10">
                            Melayani perbaikan dan perawatan kendaraan dengan teknisi berpengalaman. 
                            Spesialis motor dan mobil dengan harga terjangkau dan pelayanan terbaik.
                        </p>
                        
                        {/* Contact Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-center gap-2 text-gray-700">
                                    <span className="material-symbols-outlined text-primary">schedule</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Buka Setiap Hari</div>
                                        <div className="text-xs text-gray-500">08:00 - 17:00 WIB</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-center gap-2 text-gray-700">
                                    <span className="material-symbols-outlined text-primary">location_on</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Jl. Raya Bogor</div>
                                        <div className="text-xs text-gray-500">Depan SPBU Citeureup</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-center justify-center gap-2 text-gray-700">
                                    <span className="material-symbols-outlined text-primary">phone</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">0812-3456-7890</div>
                                        <div className="text-xs text-gray-500">WhatsApp Ready</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={onGuestBooking}
                                className="px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary/90 shadow-sm flex items-center justify-center transition-all hover:scale-105"
                            >
                                Booking Sekarang
                            </button>
                            <button
                                onClick={onGuestTracking}
                                className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-300 rounded-lg font-semibold text-lg hover:border-primary hover:text-primary flex items-center justify-center transition-all"
                            >
                                <span className="material-symbols-outlined mr-2">search</span>
                                Cek Status Servis
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Layanan Unggulan</h2>
                        <p className="text-gray-600">Dengan teknisi berpengalaman dan peralatan modern</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { 
                                icon: 'build', 
                                title: 'Service Berkala', 
                                desc: 'Ganti oli, tune up, dan perawatan rutin motor & mobil',
                                price: 'Mulai 50rb'
                            },
                            { 
                                icon: 'tire_repair', 
                                title: 'Reparasi Ban', 
                                desc: 'Tambal ban, ganti ban baru, balancing dan spooring',
                                price: 'Mulai 15rb'
                            },
                            { 
                                icon: 'electrical_services', 
                                title: 'Kelistrikan', 
                                desc: 'Perbaikan aki, alternator, starter, dan sistem kelistrikan',
                                price: 'Mulai 25rb'
                            },
                            { 
                                icon: 'car_crash', 
                                title: 'Body Repair', 
                                desc: 'Perbaikan body, cat ulang, dan restorasi kendaraan',
                                price: 'Konsultasi'
                            }
                        ].map((service, idx) => (
                            <div key={idx} className="group p-6 rounded-lg bg-gray-50 border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all duration-300">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
                                    <span className={`material-symbols-outlined text-xl group-hover:text-white ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-orange-600' : idx === 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {service.icon}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{service.desc}</p>
                                <div className="text-primary font-semibold text-sm">{service.price}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonial Section */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Kata Pelanggan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "Pelayanan ramah, harga terjangkau. Motor saya yang macet langsung normal setelah dibawa ke sini. Terima kasih Kang Acep!"
                            </p>
                            <div className="text-sm">
                                <div className="font-semibold text-gray-900">Budi Santoso</div>
                                <div className="text-gray-500">Pelanggan sejak 2018</div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-yellow-400 text-sm">star</span>
                                ))}
                            </div>
                            <p className="text-gray-600 mb-4 italic">
                                "Bengkel langganan keluarga. Teknisinya jujur dan tidak ada biaya tersembunyi. Rekomendasi banget!"
                            </p>
                            <div className="text-sm">
                                <div className="font-semibold text-gray-900">Siti Rahayu</div>
                                <div className="text-gray-500">Pelanggan sejak 2020</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary rounded-lg">
                                    <span className="material-symbols-outlined text-white">build</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Bengkel Kang Acep</h3>
                                    <p className="text-sm text-gray-400">Spesialis Motor & Mobil</p>
                                </div>
                            </div>
                            <p className="text-gray-400 mb-4">
                                Melayani perbaikan dan perawatan kendaraan sejak 1995 dengan teknisi berpengalaman 
                                dan harga terjangkau. Kepuasan pelanggan adalah prioritas utama kami.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors">
                                    <span className="material-symbols-outlined">message</span>
                                </a>
                                <a href="#" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    <span className="material-symbols-outlined">call</span>
                                </a>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-white mb-4">Layanan</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Service Berkala</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Reparasi Ban</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Kelistrikan</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Body Repair</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-white mb-4">Kontak</h4>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                    <span>Jl. Raya Bogor, Depan SPBU Citeureup</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">phone</span>
                                    <span>0812-3456-7890</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                                    <span>08:00 - 17:00 WIB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                        <p>© 2026 Bengkel Kang Acep. Melayani dengan sepenuh hati.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
