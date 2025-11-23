import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card'
import Logo from './Logo'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from './button'

const NoAccessToTrackDelivery = ({
  details = "Log in to track your products delivery status. Don't miss out on your favorite products!"
}: { details?: string }) => {
  return (
    <div className='flex items-center justify-center py-12 md:py-32 bg-gray-100 dark:bg-gray-900 p-4'>
      <Card className='w-full max-w-md p-5 bg-white dark:bg-gray-800 shadow-lg'>
        <CardHeader className='flex items-center flex-col'>
          <Logo />
          <CardTitle className='text-2xl font-bold text-center text-gray-900 dark:text-white'>
            Welcome Back!
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-center font-medium text-gray-700 dark:text-gray-300'>
            {details}
          </p>
          <SignInButton mode="modal">
            <Button className='w-full' size='lg'>Sign In</Button>
          </SignInButton>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Don’t have an account?
          </div>
          <SignUpButton mode="modal">
            <Button variant="outline" className="w-full" size="lg">
              Create an account
            </Button>
          </SignUpButton>
        </CardFooter>
      </Card>
    </div>
  )
}

export default NoAccessToTrackDelivery
