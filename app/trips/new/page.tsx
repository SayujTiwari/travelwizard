// write information about the new trip page (form, inputs, images, etc.)

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/cards";
import { cn } from "@/lib/utils";


export default function NewTrip() {
    return (
        <div className="max-w-lg mx-auto mt-10">
            <Card>
                <CardHeader> 
                    New Trip 
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        <div>
                            <input type="text" 
                            name="title" 
                            className={cn(
                                "w-full border border-gray-300 px-3 py-2", 
                                "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                )}
                            />
                        </div>
                    </form>

                </CardContent>
            </Card>
        </div>

    )


}