const getCheckout = async (_id: string) => {
    const response = await fetch(`/api/checkout/${_id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch checkout information");
    }

    return await response.json();
}

export default getCheckout;