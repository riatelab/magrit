#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@author: mthh
"""

import time
from collections import deque
from asyncio import Lock, get_event_loop

class FakeAioRedisConnection:
    def __init__(self, max_age_seconds=120, loop=None):
        assert max_age_seconds >= 1
        self.store = {}
        self.max_age = max_age_seconds
        self.lock = Lock()
        self.closed = False
        self.loop = loop or get_event_loop()
        self.clean_keys()

    async def pexpire(self, key, pexpire):
        self.expire(key, pexpire / 1000)

    async def expire(self, key, expire):
        with (await self.lock):
            item = self.store.get(key, None)
            if not item:
                return None
            self.store[key] = (item[0], time.time() + expire)

    async def persist(self, key):
        with (await self.lock):
            item = self.store.get(key, None)
            if not item:
                return None
            self.store[key] = (item[0], float('inf'))

    async def set(self, key, value, pexpire=None):
        with (await self.lock):
            if not pexpire:
                self.store[key] = (
                        str(value).encode(), float('inf'))
            else:
                self.store[key] = (
                        str(value).encode(), time.time() + pexpire / 1000)

    async def get(self, key):
        with (await self.lock):
            item = self.store.get(key, None)
            if not item:
                return None
            return item[0]

    async def delete(self, key, default=None):
        with (await self.lock):
            item = self.store.get(key, None)
            if not item:
                return None
            del self.store[key]
            return item[0]

    async def lpush(self, key, value):
        with (await self.lock):
            li, timeout = self.store.get(key, (None, None))
            if not li:
                self.store[key] = (deque([value]), float('inf'))
            else:
                li.appendleft(value)
                self.store[key] = (li, timeout)
            return

    async def lpushx(self, key, value):
        with (await self.lock):
            li, timeout = self.store.get(key, (None, None))
            if not li:
                return None
            li.appendleft(value)
            self.store[key] = (li, timeout)
            return

    async def rpush(self, key, value):
        with (await self.lock):
            li, timeout = self.store.get(key, (None, None))
            if not li:
                self.store[key] = (deque([value]), float('inf'))
            else:
                li.append(value)
                self.store[key] = (li, timeout)
            return

    async def rpushx(self, key, value):
        with (await self.lock):
            li, timeout = self.store.get(key, (None, None))
            if not li:
                return None
            li.append(value)
            self.store[key] = (li, timeout)
            return

    async def lpop(self, key):
        with (await self.lock):
            li, _ = self.store.get(key, (None, None))
            if not li:
                return None
            elem = li.popleft()
            return elem

    async def rpop(self, key):
        with (await self.lock):
            li, _ = self.store.get(key, (None, None))
            if not li:
                return None
            elem = li.pop()
            return elem

    async def lrange(self, key, start, end):
        with (await self.lock):
            li, _ = self.store.get(key, (None, None))
            if not li:
                return []
            if start == 0 and end == -1:
                return li
            return li[start, end]

    async def llen(self, key):
        with (await self.lock):
            li, _ = self.store.get(key, (None, None))
            if not li:
                return None
            return len(li)

    async def incr(self, key):
        with (await self.lock):
            value, timeout = self.store.get(key, (0, float('inf')))
            value += 1
            self.store[key] = (value, timeout)

    async def incrby(self, key, increment):
        with (await self.lock):
            value, timeout = self.store.get(key, (0, float('inf')))
            value += increment
            self.store[key] = (value, timeout)

    async def quit(self):
        with (await self.lock):
            self.closed = True
            self.store = {}
        return

    def clean_keys(self):
        if self.closed:
            return
        for k in list(self.store.keys()):
            if not self.lock.locked():
                item = self.store[k]
                if time.time() > item[1]:
                    del self.store[k]
        self.loop.call_soon_threadsafe(
            self.loop.call_later,
            self.max_age,
            self.clean_keys)
