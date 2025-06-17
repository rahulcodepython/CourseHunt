import FooterSection from '@/components/footer'
import Header from '@/components/header'
import React from 'react'

const HomeLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <main className='flex flex-col'>
            <Header />
            <section className='flex-1 flex flex-col mt-20 min-h-screen'>
                {children}
            </section>
            <FooterSection />
        </main>
    )
}

export default HomeLayout