import { cn } from "@/lib/utils";
import { Children } from "react"

const Title = ({children,className}: {children:React.ReactNode; className?:string} )=>{
    return <h2 className={cn("text-3xl font-bold font-sans text-shop-dark-yellow capitalize tracking-wide hover:line-clamp-none")}>{children}</h2>
}
const SubTitle = ({children,className}: {children:React.ReactNode; className?:string} )=>{
    return <h3 className={cn("font-semibold font-sans text-gray-900")}>{children}</h3>
}
const SubText =({children,className}: {children:React.ReactNode; className?:string})=>{
    return <p className={cn('text-gray-600 text-sm',className)}>{children}</p>
}
export {Title,SubTitle,SubText};