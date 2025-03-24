// Supabase auth integration hook

import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type UseSupabaseSessionHook = [boolean, Session | null]

export function UseSupabaseSession(): UseSupabaseSessionHook {
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        supabase.auth.getSession()
        .then(({data: {session: initialSession}}) => {
            setSession(initialSession)
            setIsLoading(false)
        })

        const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession)
            setIsLoading(false)
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])
    return [isLoading, session]
}