import React from 'react'
import Link from 'next/link'

import { Facebook, Twitter, Github, Linkedin, Youtube } from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipContent } from './tooltip'
import { TooltipTrigger } from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

interface Props{
    className?: string;
    iconClassName?: string;
    tooltipClassName?: string;
}

const socialMediaLinks = [
    { name: 'Facebook', url: 'https://www.facebook.com/vitudrastic.drastic?mibextid=ZbWKwL', icon: Facebook, className: 'w-5 h-5 hover:text-shop-dark-yellow hoverEffect' },
    { name: 'Twitter', url: 'https://x.com/Brozoned47?t=zCQBieBg-QjJwmVZlYkc3g&s=09', icon: Twitter, className: 'w-5 h-5 hover:text-shop-dark-yellow hoverEffect'},
    { name: 'Github', url: 'https://www.github.com', icon: Github,className: 'w-5 h-5 hover:text-shop-dark-yellow hoverEffect' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/vitumbiko-shaba-099631291?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', icon: Linkedin, className: 'w-5 h-5 hover:text-shop-dark-yellow hoverEffect' },
    { name: 'YouTube', url: 'https://www.youtube.com/@vitumbikoshaba', icon: Youtube, className: 'w-5 h-5 hover:text-shop-dark-yellow hoverEffect' },

]

const SocialMedia = ({className,iconClassName,tooltipClassName}: Props) => {

  return (
    <TooltipProvider>
        <div className={cn("flex items-center gap-4",className)}>
            {socialMediaLinks?.map((item) => (
                <Tooltip key={item?.name}>
                    {/* Add your tooltip content or icon here */}
                    <TooltipTrigger asChild>
                        <Link key={item?.name} href={item?.url}
                        target='_blank' rel='noopener noreferrer' className={cn("p-2 border rounded-full hover:bg-gray-200/20 hoverEffect hover:text-white",iconClassName)}>
                        <item.icon className={item.className} />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                    {item?.name}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    </TooltipProvider>
  )}
export default SocialMedia
