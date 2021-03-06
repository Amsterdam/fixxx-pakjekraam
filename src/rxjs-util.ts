import { Observable } from 'rxjs';

import { delay, retryWhen, tap } from 'rxjs/operators';

export const retry = <T>(attempts: number, delayTime: number): ((source$: Observable<T>) => Observable<T>) => {
    let failedAttempts = 0;

    return (source$: Observable<T>) =>
        source$.pipe(
            retryWhen(error$ =>
                error$.pipe(
                    tap((error: Error) => {
                        if (failedAttempts >= attempts) {
                            throw error;
                        }

                        failedAttempts += 1;

                        console.log(`Retry attempt #${failedAttempts}`);
                    }),
                    delay(delayTime),
                ),
            ),
        );
};
