import {auth} from "@/auth"
import {Button} from "@/components/ui/button";
import Link from "next/link";

// only accessible when user is signed 
export default async function TripsPage() {
    const session = await auth()
    if (!session) {
        return (<div className="flex justify-center items-center h-screen text-gray-700 text-xl">
            {" "}
            Please sign in to view your trips.
        </div>
        );
    }

    // from here can assume user is signed in bc auth is done above

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <div>
                <h1>Dashboard</h1>
                <Link href="/trips/new">
                    <Button>New Trip</Button>
                </Link>
            </div>
        </div>
    )


}