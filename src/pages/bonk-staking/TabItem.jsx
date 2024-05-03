import React from "react";

const TabItem = ({ selectedForm, setSelectedForm, name, value }) => {
    return (
        <div
            className={`
                  flex items-center justify-center cursor-pointer w-1/2 h-full rounded-tr-lg rounded-tl-lg
                  ${
                      selectedForm === value
                          ? "dark:bg-[#ec8c1d] bg-[#ec8c1d] text-white"
                          : "bg-transparent dark:text-[#ababab] text-black"
                  }
                `}
            fontFamily={"Montserrat"}
            onClick={() => setSelectedForm(value)}
        >
            {name}
        </div>
    );
};
export default TabItem;
