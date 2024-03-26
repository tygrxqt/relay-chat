import { DirectMessage } from "@/types/message";

export default function Message({ msg }: { msg: DirectMessage }) {
    return (
        <>
            <div key={msg.id} className="flex flex-row gap-2 p-2 w-full hover:bg-neutral-200/50 hover:dark:bg-neutral-800/50 transition-colors">
                <div className="flex flex-row gap-2 items-center">
                    <img src={`${import.meta.env.VITE_AUTH_URL}/api/files/_pb_users_auth_/${msg.expand.author.id}/${msg.expand.author.avatar}`} alt={msg.expand.author.username} className="w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-0">
                        <span className="font-medium">
                            {msg.expand.author?.username}
                        </span>
                        <span className="text-wrap">
                            {msg.content}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}