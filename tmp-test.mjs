import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    console.log("Testing 429...")
    for (let i = 0; i < 50; i++) {
        supabase.auth.getUser('faketoken').then((res) => {
            if (res.error) {
                console.log("Error status:", res.error.status, res.error.message)
            }
        })
    }
}

test()
