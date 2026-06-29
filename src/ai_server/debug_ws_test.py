import asyncio
import json

import websockets


async def test_origin(origin: str) -> None:
    try:
        ws = await websockets.connect(
            "ws://127.0.0.1:8000/ws/predict",
            origin=origin,
            open_timeout=5,
        )
        await ws.send(json.dumps({"image": ""}))
        await asyncio.sleep(0.2)
        await ws.close()
        print("OK", origin)
    except Exception as exc:
        print("ERR", origin, type(exc).__name__, exc)


async def main() -> None:
    await test_origin("http://localhost:5173")
    await test_origin("http://127.0.0.1:5173")
    await test_origin("http://[::1]:5173")


if __name__ == "__main__":
    asyncio.run(main())
