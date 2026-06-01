import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

interface ResponseBody {
  data?: unknown;
  message?: string;
  success?: boolean;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: ResponseBody | unknown) => {
        if (value && typeof value === "object" && "success" in (value as ResponseBody)) {
          return value;
        }

        if (value && typeof value === "object" && "data" in (value as ResponseBody)) {
          const body = value as ResponseBody;
          return {
            success: true,
            data: body.data ?? null,
            message: body.message ?? "OK"
          };
        }

        return {
          success: true,
          data: value ?? null,
          message: "OK"
        };
      })
    );
  }
}
