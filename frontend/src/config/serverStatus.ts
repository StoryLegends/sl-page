export type StatusType = 'active' | 'closed' | 'announced' | 'soon';

export interface ServerStatusConfig {
    /**
     * Current status of the server
     * active: Season is live
     * closed: Server is closed/between seasons
     * announced: New season announced but no date yet
     * soon: Season starting very soon (with date)
     */
    status: StatusType;

    /**
     * Title of the current/upcoming season or status
     * e.g. "StoryLegends Island" or "В данный момент сервер закрыт"
     */
    title: string;

    /**
     * Main description text
     */
    description: string;

    /**
     * Optional date string (e.g. "12 декабря" or "xx.xx")
     * Used for 'active' (started on) or 'soon' (starts on)
     */
    date?: string;
}

export const serverStatus: ServerStatusConfig = {
    status: 'closed',
    title: 'StoryLegends Island',
    description: 'Сезон подошел к концу! Спасибо всем за участие. Следите за новостями в нашем Discord, чтобы не пропускать новости об сервере!.'
};
