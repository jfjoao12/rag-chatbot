"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"

export default function NavBar() {
    const [buttonClicked, setButtonIsClicked] = useState(false)
    const pathname = usePathname()
    const isHome = pathname === "/home"
    console.log(isHome)

    return (
        <>
            {isHome ?
                <div className="flex flex-col w-full h-10 mt-20 justify-center items-center">
                    <div
                        className={`transition-shadow duration-200 ease-in-out
                            flex text-center bg-white h-10 w-20 rounded-lg 
                            ${buttonClicked ? "shadow-inner shadow-black/30 shadow-sm" : "shadow-inner shadow-lg"}`}
                        onClick={() => setButtonIsClicked(!buttonClicked)}>
                    </div>
                </div>
                :
                <div>
                </div>}
        </>

    )
}