import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import 'react-toastify/dist/ReactToastify.css';

import {
  Route,
  Routes,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import ThemeProvider from './components/ThemeProvider';
import { WalletContextProvider } from './components/WalletContextProvider';
import Home from './pages/bonk-staking';

function App() {
    return (
        <>
            <ThemeProvider>
                <WalletContextProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                    </Routes>
                    <ToastContainer />
                </WalletContextProvider>
            </ThemeProvider>
        </>
    );
}

export default App;
