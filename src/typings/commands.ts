export interface InteractionPayload {

    t: "INTERACTION_CREATE" | String;

    d: {

        type: number;
        token: string;

        member: {

            user: {
                id: string;
                username: string;
                avatar: string;
                discriminator: string;
                public_flags: number;
            }

            roles: string[];
            premium_since: any;
            permissions: string;
            pending: boolean;
            nick: string | null;
            mute: boolean;
            joined_at: string;
            is_pending: boolean;
            deaf: false;

        }

        id: string;
        guild_id: string;

        data: {

            options: {

                name: string;
                value?: any;
                options?: InteractionPayload["d"]["data"]["options"];

            }[];

            name: string;
            id: string;

        };

        channel_id: string;

    }

}