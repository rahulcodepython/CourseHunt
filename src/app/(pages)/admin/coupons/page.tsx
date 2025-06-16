import { getBaseUrl } from '@/action';
import CouponLayout from './coupon-layout';

const CouponPage = async () => {
    const baseurl = await getBaseUrl();

    const response = await fetch(`${baseurl}/api/coupons/all`, {
        cache: 'no-store',
    });

    const coupons = await response.json();

    return (
        <CouponLayout initialCoupons={coupons} />
    )
}

export default CouponPage