import "react-toastify/dist/ReactToastify.css";
import "./index.css";

import { useState } from "react";

import { ToastContainer } from "react-toastify";

import { styled } from "@mui/system";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import BakeCardLvlOne from "./BakeCard_one";
import BakeCardLvlThree from "./BakeCard_three";
import BakeCardLvlTwo from "./BakeCard_two";
import { config } from "./config";
import Footer from "./Footer";
import Header from "./Header";

const Wrapper = styled("div")(({ theme }) => ({
    position: "relative",
    maxWidth: 500,
    margin: "0 auto",

    [theme.breakpoints.down("sm")]: {
        maxWidth: "100%",
    },
}));

const WalletButton = styled("div")(() => ({
    display: "flex",
    flexDirection: "row-reverse",
}));

export default function Home() {
    const [tabSelection, setTabSelection] = useState(0);
    return (
        <Wrapper>
            <WalletButton>
                <WalletMultiButton
                    variant="text"
                    style={{
                        border: "2px solid black",
                        fontWeight: 900,
                        background: "transparent",
                        borderRadius: "10px",
                        color: "black",
                    }}
                />
            </WalletButton>
            <Header
                tabSelection={tabSelection}
                setTabSelection={setTabSelection}
            />
            <BakeCardLvlOne />
            {/* {tabSelection === config.LEVEL_ONE && <BakeCardLvlOne />} */}
            {/* {tabSelection === config.LEVEL_TWO && <BakeCardLvlTwo />}
            {tabSelection === config.LEVEL_THREE && <BakeCardLvlThree />} */}
            <Footer />
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </Wrapper>
    );
}
