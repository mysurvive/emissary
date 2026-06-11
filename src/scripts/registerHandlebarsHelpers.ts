export function registerHandlebarsHelpers(): void {
    Handlebars.registerHelper("log", (handlebarsItem: unknown) => {
        console.log(handlebarsItem);
    });

    Handlebars.registerHelper("when", function (this: unknown, op1, operator, op2, opts) {
        const operators: Record<string, (l: unknown, r: unknown) => unknown> = {
                eq: function (l: unknown, r: unknown) {
                    return l === r;
                },
                noteq: function (l: unknown, r: unknown) {
                    return l !== r;
                },
                gt: function (l: number, r: number) {
                    return l > r;
                },
                gte: function (l: number, r: number) {
                    return l >= r;
                },
                lt: function (l: number, r: number) {
                    return l < r;
                },
                lte: function (l: number, r: number) {
                    return l <= r;
                },
                or: function (l: unknown, r: unknown) {
                    return l || r;
                },
                and: function (l: unknown, r: unknown) {
                    return l && r;
                },
                "%": function (l: number, r: number) {
                    return l % r === 0;
                },
            },
            result: unknown = operators[operator](op1, op2);

        if (result) return opts.fn(this);
        else return opts.inverse(this);
    });

    Handlebars.registerHelper("key", function (opts) {
        return opts.data.key ?? opts.data.root.key;
    });

    Handlebars.registerHelper("cap", function (op) {
        return String(op).charAt(0).toUpperCase() + String(op).slice(1);
    });

    Handlebars.registerHelper("concat", (...params: unknown[]): string => {
        return params.slice(0, -1).join("");
    });
}
