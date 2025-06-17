import { getBaseUrl } from '@/action';
import { cookies } from 'next/headers';
import CouponLayout from './coupon-layout';

const CouponPage = async () => {
    const baseurl = await getBaseUrl();

    const cookieStore = await cookies();

    const response = await fetch(`${baseurl}/api/coupons/all`, {
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookieStore.getAll().map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
        },

    });

    const coupons = await response.json();

    return (
        <CouponLayout initialCoupons={coupons} />
    )
}

export default CouponPage