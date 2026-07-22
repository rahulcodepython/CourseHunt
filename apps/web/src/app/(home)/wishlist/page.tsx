"use client";

import { Icon } from "@package/components/icon";
import { Button } from "@package/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@package/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@package/ui/table";
import { useWishlistQuery, useRemoveCourseFromWishlistMutation, useClearWishlistMutation } from "@package/query-hooks/wishlist.api";
import Loading from "@package/components/loading";
import Link from "next/link";

export default function WishlistPage() {
	const { data: raw, isLoading } = useWishlistQuery();
	const removeItem = useRemoveCourseFromWishlistMutation();
	const clearAll = useClearWishlistMutation();

	const items = raw?.data ?? [];

	if (isLoading) return <Loading />;

	return (
		<div className="max-w-4xl mx-auto p-4 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">My Wishlist</h1>
				{items.length > 0 && (
					<Button
						variant="destructive"
						size="sm"
						onClick={() => clearAll.mutate()}
						disabled={clearAll.isPending}
					>
						<Icon name="IconTrash" className="h-4 w-4 mr-2" />
						{clearAll.isPending ? "Clearing..." : "Clear All"}
					</Button>
				)}
			</div>

			{items.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<Icon name="IconHeartOff" className="h-12 w-12 mx-auto mb-4" />
						<p className="text-lg font-medium">Your wishlist is empty</p>
						<p className="text-sm mt-1">Browse courses and add them to your wishlist!</p>
						<Link href="/courses">
							<Button variant="outline" className="mt-4">Browse Courses</Button>
						</Link>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>{items.length} {items.length === 1 ? "course" : "courses"}</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[80px]">Image</TableHead>
									<TableHead>Course</TableHead>
									<TableHead className="w-[100px] text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={item.id}>
										<TableCell>
											<div className="w-16 h-10 rounded overflow-hidden bg-muted">
												<img
													src={item.course.thumbnail || "/placeholder.svg"}
													alt={item.course.title}
													className="w-full h-full object-cover"
												/>
											</div>
										</TableCell>
										<TableCell>
											<Link href={`/courses/${item.course.id}`} className="font-medium hover:text-primary">
												{item.course.title}
											</Link>
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => removeItem.mutate(item.id)}
												disabled={removeItem.isPending}
											>
												<Icon name="IconX" className="h-4 w-4" />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
