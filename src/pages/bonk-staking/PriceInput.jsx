import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/system";

import { config } from "./config";

const SolInput = styled("input")({
    fontSize: 24,
    fontWeight: 500,
    padding: "9px 70px 12px 12px",
    textAlign: "right",
    borderRadius: 0,
    border: "1px solid #555",
    background: "white",
    width: "100%",
    outline: "none",
    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
        WebkitAppearance: "none",
        margin: 0,
        MozAppearance: "textfield",
    },
});

export default function PriceInput({ value, max, onChange = () => {} }) {
    return (
        <Box
            position="relative"
            display="flex"
            style={{ flexWrap: "wrap", flexDirection: "row", flex: 1 }}
        >
            <SolInput
                type="number"
                fontFamily={"Montserrat"}
                min={0}
                max={max}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            <Typography
                fontFamily={"Montserrat"}
                fontSize={24}
                position="absolute"
                top={10}
                right={8}
                fontWeight={500}
                color="black"
            >
                {config.REWARD_TOKEN_SYMBOL}
            </Typography>
        </Box>
    );
}
