import { useLocation, Outlet } from 'react-router-dom';
import PillNav from './layout/PillNav';
import FloatingLines from './ui/FloatingLines/FloatingLines';
import './Layout.css';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { label: 'Wallet', href: '/' },
        { label: 'Market', href: '/market' },
        { label: 'Account', href: '/login' }
    ];

    return (
        <div className="layout">
            <FloatingLines
                linesGradient={['#8B5CF6', '#3B82F6', '#EC4899', '#8B5CF6']}
                animationSpeed={0.5}
                parallaxStrength={0.1}
            />
            <PillNav
                logo="https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=032"
                logoAlt="CryptoVue"
                items={navItems}
                activeHref={location.pathname}
                baseColor="#fff"
                pillColor="rgba(13, 7, 22, 0.8)"
            />
            <div className="layout-body">
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

