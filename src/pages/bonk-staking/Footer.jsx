import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { config } from "./config";

export default function Footer() {
    return (
        <div>
            <Grid container justifyContent="center" spacing={3} marginTop={4}>
                <Grid item>
                    <a href="https://" target="__blank">
                    {/* <a href="https://twitter.com/sicoinsol24" target="__blank"> */}
                        <img
                            src={"/images/TGicon.png"}
                            alt=""
                            width={44}
                            height={44}
                        />
                    </a>
                </Grid>
                <Grid item>
                    <a href="https://" target="__blank">
                        <img
                            src={"/images/TWicon.png"}
                            alt=""
                            width={46}
                            height={46}
                        />
                    </a>
                </Grid>
            </Grid>
            <center>
                <Typography
                    variant="h8"
                    marginTop={4}
                    style={{ fontFamily: "Montserrat" }}
                >
                    <br />
                    COPYRIGHT © 2024 {config.REWARD_TOKEN_SYMBOL} Staking
                </Typography>
            </center>
        </div>
    );
}
