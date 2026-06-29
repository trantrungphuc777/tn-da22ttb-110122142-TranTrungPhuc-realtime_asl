import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children, hideNav = false, hideFooter = false }) => {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative flex flex-col overflow-x-hidden">

            {/* Hex + Particle Grid — scrolls upward continuously, clipped so no scrollbar */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="grid-rise w-full particle-grid hex-grid" style={{ height: '200%', opacity: 0.9 }} />
            </div>

            {/* Aurora Orbs — 2 orbs tĩnh, nhẹ */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                    className="absolute top-[15%] left-[5%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]"
                    style={{ willChange: 'auto' }}
                />
                <div 
                    className="absolute top-[40%] right-[5%] w-[500px] h-[500px] bg-sky-400/15 rounded-full blur-[120px]"
                    style={{ willChange: 'auto' }}
                />
            </div>

            {/* Floating Particles — removed for performance */}

            <div className="relative z-10 flex flex-col flex-1">
                <Header hideNav={hideNav} />
                <main key={location.pathname} className="flex-1 pt-20 sm:pt-24 pb-4 sm:pb-6 page-enter">
                    {children}
                </main>
                {!hideFooter && <Footer />}
            </div>
        </div>
    );
};

export default Layout;
