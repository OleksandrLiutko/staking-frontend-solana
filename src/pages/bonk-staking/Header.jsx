import "./index.css";

import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";

import { config } from "./config";
import TabItem from "./TabItem";

const Wrapper = styled("div")(({ theme }) => ({
    textAlign: "center",
    paddingBottom: 24,
    [theme.breakpoints.down("md")]: {
        h5: {
            fontSize: 20,
            margin: 0,
        },
    },
}));

export default function Header(props) {
    return (
        <Wrapper>
            <img
                src={"/images/panda.jpg"}
                className="logo"
                alt=""
                style={{ margin: "auto", marginTop: "-20px" }}
            />
            <div className="flex items-center justify-center h-12 pt-1 mx-6 mt-6">
                {/* <TabItem
                    name="Level 1"
                    value={config.LEVEL_ONE}
                    selectedForm={props.tabSelection}
                    setSelectedForm={props.setTabSelection}
                    style={{ fontFamily: "Montserrat" }}
                />
                <TabItem
                    name="Level 2"
                    value={config.LEVEL_TWO}
                    selectedForm={props.tabSelection}
                    setSelectedForm={props.setTabSelection}
                    style={{ fontFamily: "Montserrat" }}
                />
                <TabItem
                    name="Level 3"
                    value={config.LEVEL_THREE}
                    selectedForm={props.tabSelection}
                    setSelectedForm={props.setTabSelection}
                    style={{ fontFamily: "Montserrat" }}
                /> */}
            </div>
            <hr style={{ borderColor: "#ec8c1d", borderWidth: 1 }} />
            <Typography
                variant="h6"
                marginTop={1}
                style={{ color: "black", fontFamily: "Montserrat" }}
            >
                {/* <b style={{ fontFamily: "Montserrat" }}> */}
                Staked $PND is locked until maturity.
                {/* </b>$PND staking is FCFS with ...<br></br> a 1 million maximum reward per level. */}
            </Typography>
        </Wrapper>
    );
}
