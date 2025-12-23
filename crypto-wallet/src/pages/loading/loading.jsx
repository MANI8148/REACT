import React from 'react';
import Loading from '../../components/loading/Loading';

const LoadingPage = () => {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 9999, background: '#0f172a' }}>
            <Loading />
        </div>
    );
};

export default LoadingPage;
