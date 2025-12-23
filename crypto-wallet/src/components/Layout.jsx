import { useLocation, Outlet } from 'react-router-dom';
import PillNav from './layout/PillNav';
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
            <PillNav
                logo="https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=032"
                logoAlt="CryptoVue"
                items={navItems}
                activeHref={location.pathname}
                baseColor="#fff"
                pillColor="#0d0716"
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

