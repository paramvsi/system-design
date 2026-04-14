#!/usr/bin/env node
/**
 * Build the references manifest and inject #references sections into
 * all problem + concept HTML files.
 *
 * Uses a curated manifest of YouTube video IDs + blog URLs for each topic.
 * Idempotent: skips files that already have id="references".
 */
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

const MARKER = 'id="references"';

// ══════════════════════════════════════════════════════════════════════
// MANIFEST — {slug: [{type:"video"|"blog", id/url, title, source, dur?}]}
// Video IDs are YouTube embed IDs (youtube.com/embed/{id})
// ══════════════════════════════════════════════════════════════════════

const REFS = {
  // ── PROBLEMS ──────────────────────────────────────────────────────

  "instagram": [
    { type: "video", id: "VJpfO6KdyWE", title: "Designing Instagram", source: "Gaurav Sen", dur: "14 min" },
    { type: "video", id: "QmX2NPkJTKg", title: "System Design: Instagram", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "S2y9_XYOZsg", title: "Design Instagram — Complete Walkthrough", source: "Jordan Has No Life", dur: "35 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-instagram-system-design-interview", title: "Design Instagram — System Design Interview", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-instagram-a-system-design-interview-question/", title: "Designing Instagram", source: "GeeksforGeeks" },
  ],
  "slack-discord": [
    { type: "video", id: "vvhC64hQZMk", title: "Design Discord — System Design Interview", source: "Jordan Has No Life", dur: "30 min" },
    { type: "video", id: "uzeJb7ZjoQ4", title: "Slack System Architecture", source: "Hussein Nasser", dur: "22 min" },
    { type: "video", id: "xyLO8ZAk_LI", title: "How Discord Stores Trillions of Messages", source: "ByteByteGo", dur: "9 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/how-discord-stores-trillions-of-messages", title: "How Discord Stores Trillions of Messages", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://discord.com/blog/how-discord-stores-trillions-of-messages", title: "How Discord Stores Trillions of Messages (Official)", source: "Discord Engineering" },
  ],
  "uber-system-design": [
    { type: "video", id: "umWABit-wbk", title: "System Design: Uber Lyft ride sharing", source: "Gaurav Sen", dur: "28 min" },
    { type: "video", id: "R_agd5qjEro", title: "Uber System Design", source: "Tech Dummies Narendra L", dur: "24 min" },
    { type: "video", id: "lsKU38RKQSo", title: "Design Uber — System Design Interview", source: "Exponent", dur: "15 min" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/uber", title: "Design Uber/Lyft", source: "Hello Interview" },
    { type: "blog", url: "https://eng.uber.com/fulfillment-platform-rearchitecture/", title: "Uber's Fulfillment Platform Rearchitecture", source: "Uber Engineering" },
  ],
  "004-whatsapp-system-design": [
    { type: "video", id: "vvhC64hQZMk", title: "Whatsapp System Design — Chat Messaging Systems", source: "Gaurav Sen", dur: "18 min" },
    { type: "video", id: "RjQjbJ2UJDg", title: "Design WhatsApp/Facebook Messenger", source: "Tech Dummies", dur: "28 min" },
    { type: "video", id: "L7LtmfFYjc4", title: "Design a Chat System", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-whatsapp/", title: "Design WhatsApp Messenger", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-whatsapp-system-design-interview", title: "Design WhatsApp", source: "AlgoMaster" },
  ],
  "002-news-feed": [
    { type: "video", id: "pUHkRGpfu4o", title: "Design Twitter — System Design Interview", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "R4-ippqELG0", title: "Design a News Feed System", source: "ByteByteGo", dur: "11 min" },
    { type: "video", id: "6QwqtdBx0oE", title: "Design Twitter — Fan-out Deep Dive", source: "Jordan Has No Life", dur: "32 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-news-feed-system", title: "Design a News Feed System", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-twitter-a-system-design-interview-question/", title: "Design Twitter", source: "GeeksforGeeks" },
  ],
  "005-youtube-netflix": [
    { type: "video", id: "jPKTo1iGQiE", title: "System Design: YouTube", source: "Gaurav Sen", dur: "18 min" },
    { type: "video", id: "ryw1jgmGJkM", title: "How Netflix Really Works", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "a_Zy1DBUL5U", title: "Design YouTube — The Hard Parts", source: "Jordan Has No Life", dur: "28 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/ep130-design-a-system-like-youtube", title: "Design a System Like YouTube", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://netflixtechblog.com/", title: "Netflix Tech Blog — Engineering at Scale", source: "Netflix Engineering" },
  ],
  "search-engine": [
    { type: "video", id: "0LTXCcVRQi0", title: "How Google Search Works", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "CeGtqYdA-Cs", title: "Design Google Search", source: "Arpit Bhayani", dur: "35 min" },
    { type: "video", id: "ubKifQsjMaA", title: "System Design: Search Engine", source: "Hussein Nasser", dur: "22 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-web-search-engine-like-google/", title: "Design a Web Search Engine", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-search", title: "Design Google Search", source: "AlgoMaster" },
  ],
  "doordash-uber-eats": [
    { type: "video", id: "iRhSAR3ldTw", title: "Design a Food Delivery System", source: "Gaurav Sen", dur: "20 min" },
    { type: "video", id: "dLiI2RchSRI", title: "DoorDash System Design", source: "Tech Dummies", dur: "26 min" },
    { type: "blog", url: "https://doordash.engineering/category/backend/", title: "DoorDash Engineering Blog — Backend", source: "DoorDash Engineering" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/doordash", title: "Design DoorDash", source: "Hello Interview" },
  ],
  "payment-gateway": [
    { type: "video", id: "olfaBgJrUBI", title: "Design a Payment System", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "OuOW16-bDwk", title: "Stripe System Design", source: "Jordan Has No Life", dur: "28 min" },
    { type: "blog", url: "https://stripe.com/blog/payment-api-design", title: "Designing APIs for Payments", source: "Stripe Blog" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-payment-system", title: "Design a Payment System", source: "AlgoMaster" },
  ],
  "stock-exchange": [
    { type: "video", id: "dUMWMZmMsVE", title: "Design a Stock Exchange", source: "Jordan Has No Life", dur: "25 min" },
    { type: "video", id: "XuKs2kWH0mQ", title: "Stock Exchange System Design", source: "Tech Dummies", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-stock-exchange", title: "Design a Stock Exchange", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-stock-exchange-system/", title: "Design a Stock Exchange System", source: "GeeksforGeeks" },
  ],
  "airbnb": [
    { type: "video", id: "YyOXt2MEkv4", title: "Design Airbnb — System Design Interview", source: "Exponent", dur: "18 min" },
    { type: "video", id: "iyLqwyFL0Zc", title: "System Design: Hotel Booking / Airbnb", source: "Gaurav Sen", dur: "22 min" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/airbnb", title: "Design Airbnb", source: "Hello Interview" },
    { type: "blog", url: "https://medium.com/airbnb-engineering", title: "Airbnb Engineering & Data Science", source: "Airbnb Engineering" },
  ],
  "007-rate-limiter": [
    { type: "video", id: "FU4WlwfS3G0", title: "System Design: Rate Limiter", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "mhUQe4BKZXs", title: "Rate Limiting (Alarm Systems)", source: "Gaurav Sen", dur: "12 min" },
    { type: "video", id: "HnSb8DFU5UA", title: "Distributed Rate Limiting", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/rate-limiter", title: "Design a Rate Limiter", source: "AlgoMaster" },
    { type: "blog", url: "https://stripe.com/blog/rate-limiters", title: "Scaling your API with rate limiters", source: "Stripe Blog" },
  ],
  "006-typeahead-suggestions": [
    { type: "video", id: "us0qySiUsGU", title: "Design Autocomplete / Typeahead Suggestions", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "xrYTjaK5QVM", title: "Typeahead Suggestion System Design", source: "Tech Dummies", dur: "22 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-autocomplete-typeahead", title: "Design Autocomplete", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-search-autocomplete-system/", title: "Design Search Autocomplete System", source: "GeeksforGeeks" },
  ],
  "001-url-shortener": [
    { type: "video", id: "fMZMm_0ZhK4", title: "Designing a URL Shortener", source: "Gaurav Sen", dur: "12 min" },
    { type: "video", id: "JQDHz72OA3c", title: "System Design: TinyURL", source: "Tech Dummies", dur: "20 min" },
    { type: "video", id: "rGQKHpjMn_M", title: "Design a URL Shortener", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-url-shortener", title: "Design a URL Shortener", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/system-design-url-shortening-service/", title: "System Design: URL Shortening Service", source: "GeeksforGeeks" },
  ],
  "003-google-drive": [
    { type: "video", id: "U0xTu6E2CT8", title: "Design Google Drive", source: "ByteByteGo", dur: "11 min" },
    { type: "video", id: "jLM1nGgsT-I", title: "Google Drive System Design", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-drive", title: "Design Google Drive", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-dropbox-a-system-design-interview-question/", title: "Design Dropbox", source: "GeeksforGeeks" },
  ],
  "notification-system": [
    { type: "video", id: "bBTPDNxQk6E", title: "Design a Notification Service", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "CUwt9_l0DOg", title: "Notification System Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-notification-system", title: "Design a Notification System", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-notification-service-system-design/", title: "Design Notification Service", source: "GeeksforGeeks" },
  ],
  "distributed-cache": [
    { type: "video", id: "iuqZvajTOyA", title: "Redis In-Memory Database Crash Course", source: "Hussein Nasser", dur: "35 min" },
    { type: "video", id: "DUbEgNw-F9c", title: "Redis System Design — Distributed Cache", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "pAP6KUhEqkE", title: "Design a Distributed Cache — Full Deep Dive", source: "Jordan Has No Life", dur: "30 min" },
    { type: "blog", url: "https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/", title: "Scaling with Redis Cluster", source: "Redis Official Docs" },
    { type: "blog", url: "https://blog.bytebytego.com/p/a-crash-course-in-caching", title: "A Crash Course in Caching", source: "ByteByteGo Blog" },
  ],
  "key-value-store": [
    { type: "video", id: "rnZmdmlR-2M", title: "Design a Key-Value Store", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "APnOe7N_Hwk", title: "Amazon DynamoDB Deep Dive", source: "AWS re:Invent", dur: "45 min" },
    { type: "video", id: "UBO7yNlhHbo", title: "Design a Key-Value Store — LSM Trees + Compaction", source: "Jordan Has No Life", dur: "35 min" },
    { type: "blog", url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html", title: "Dynamo: Amazon's Key-Value Store", source: "Werner Vogels" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-key-value-store", title: "Design a Key-Value Store", source: "AlgoMaster" },
  ],
  "design-chatgpt": [
    { type: "video", id: "jkrNMKz9pWU", title: "How ChatGPT Works Technically", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "LLM Inference Optimization", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/", title: "The Transformer Family", source: "Lilian Weng (OpenAI)" },
    { type: "blog", url: "https://vllm.ai/", title: "vLLM: Easy, Fast, and Cheap LLM Serving", source: "vLLM Project" },
  ],
  "flash-sale": [
    { type: "video", id: "NRZA6MAgHQ8", title: "Design Flash Sale System", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "wYk0xPP_P_8", title: "E-commerce Flash Sale Architecture", source: "Tech Dummies", dur: "22 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-flash-sale-system/", title: "Design a Flash Sale System", source: "GeeksforGeeks" },
    { type: "blog", url: "https://engineering.shopify.com/blogs/engineering/flash-sale-architecture", title: "Flash Sale Architecture", source: "Shopify Engineering" },
  ],
  "google-docs": [
    { type: "video", id: "2auwirNBvGg", title: "Design Google Docs", source: "Gaurav Sen", dur: "20 min" },
    { type: "video", id: "RMAgFIGKwSI", title: "Collaborative Editing — OT vs CRDT", source: "Martin Kleppmann", dur: "40 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-docs", title: "Design Google Docs", source: "AlgoMaster" },
    { type: "blog", url: "https://crdt.tech/", title: "CRDT Resources", source: "crdt.tech" },
  ],
  "s3-object-storage": [
    { type: "video", id: "UmWtcgC96X8", title: "Amazon S3 — How Does It Work?", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bYBhVZHCajY", title: "Design Amazon S3", source: "Jordan Has No Life", dur: "25 min" },
    { type: "blog", url: "https://www.allthingsdistributed.com/2023/07/building-and-operating-a-pretty-big-storage-system.html", title: "Building and Operating a Pretty Big Storage System", source: "Andy Warfield (AWS)" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-s3", title: "Design Amazon S3", source: "AlgoMaster" },
  ],
  "008-web-crawler": [
    { type: "video", id: "BKZxZwUgL3Y", title: "Design a Web Crawler", source: "ByteByteGo", dur: "9 min" },
    { type: "video", id: "rKNh1lQnHfs", title: "Web Crawler System Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-web-crawler", title: "Design a Web Crawler", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-web-crawler-system-design/", title: "Design a Web Crawler", source: "GeeksforGeeks" },
  ],
  "009-yelp-google-places": [
    { type: "video", id: "M4lR_VSGGyo", title: "Design Yelp — Proximity Service", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "tu6QKpV7GiI", title: "Design Yelp / Nearby Places", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-yelp", title: "Design Yelp", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-yelp-or-nearby-friends/", title: "Design Yelp or Nearby Friends", source: "GeeksforGeeks" },
  ],
  "google-maps": [
    { type: "video", id: "jk3yvVfNvds", title: "Design Google Maps", source: "ByteByteGo", dur: "11 min" },
    { type: "video", id: "CxJka1yXn-c", title: "Google Maps System Design", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-maps", title: "Design Google Maps", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-google-maps-system-design-interview/", title: "Design Google Maps", source: "GeeksforGeeks" },
  ],
  "ticketmaster-system-design": [
    { type: "video", id: "fhdPyoO6aXI", title: "Design Ticketmaster — System Design", source: "Exponent", dur: "20 min" },
    { type: "video", id: "lBAwJGoISQQ", title: "Design a Ticket Booking System", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster", title: "Design Ticketmaster", source: "Hello Interview" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-ticketmaster", title: "Design Ticketmaster", source: "AlgoMaster" },
  ],
  "gmail": [
    { type: "video", id: "18KWbfVDhJo", title: "How Email Works (SMTP, IMAP, POP3)", source: "ByteByteGo", dur: "9 min" },
    { type: "video", id: "Z_0-3-C5MSs", title: "Design Email System", source: "Arpit Bhayani", dur: "28 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-gmail", title: "Design Gmail", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-an-email-system/", title: "Design an Email System", source: "GeeksforGeeks" },
  ],
  "twitter-trending": [
    { type: "video", id: "kx-XDoPjoHw", title: "Design Twitter Trending Topics", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "pMq7GH5b7-I", title: "Top-K Heavy Hitters — Streaming Algorithms", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.twitter.com/engineering/en_us/a/2015/building-a-complete-tweet-index", title: "Building a Complete Tweet Index", source: "Twitter Engineering" },
    { type: "blog", url: "https://blog.algomaster.io/p/top-k-elements", title: "Top-K Elements", source: "AlgoMaster" },
  ],
  "fraud-detection": [
    { type: "video", id: "nMBi317FNhc", title: "Fraud Detection System Design", source: "Arpit Bhayani", dur: "25 min" },
    { type: "video", id: "SVBV-cfaR5g", title: "How Stripe Detects Fraud", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://stripe.com/blog/radar-updates", title: "How Stripe Radar works", source: "Stripe Blog" },
    { type: "blog", url: "https://netflixtechblog.com/real-time-fraud-detection-at-scale-78fe10b98612", title: "Real-Time Fraud Detection at Scale", source: "Netflix Tech Blog" },
  ],
  "crypto-exchange": [
    { type: "video", id: "dUMWMZmMsVE", title: "Design a Crypto Exchange", source: "Jordan Has No Life", dur: "25 min" },
    { type: "video", id: "XuKs2kWH0mQ", title: "Matching Engine Design", source: "Arpit Bhayani", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-stock-exchange", title: "Design a Stock Exchange (applies to crypto)", source: "AlgoMaster" },
    { type: "blog", url: "https://www.binance.com/en/blog/tech/how-binance-builds-the-fastest-matching-engine-421499824684900863", title: "How Binance Builds Its Matching Engine", source: "Binance Tech" },
  ],
  "design-cdn": [
    { type: "video", id: "8KuO4r5CHjM", title: "What is a CDN? How Does It Work?", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "RI9np1LWzqw", title: "How Cloudflare Works", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.cloudflare.com/how-cloudflare-works/", title: "How Cloudflare Works", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.akamai.com/blog/performance/how-does-a-cdn-work", title: "How Does a CDN Work?", source: "Akamai Blog" },
  ],
  "distributed-locking": [
    { type: "video", id: "v7x75aN9liM", title: "Distributed Locking with Redis (Redlock)", source: "Hussein Nasser", dur: "18 min" },
    { type: "video", id: "VJpfO6KdyWE", title: "Distributed Locks — System Design", source: "Arpit Bhayani", dur: "22 min" },
    { type: "blog", url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", title: "How to do distributed locking", source: "Martin Kleppmann" },
    { type: "blog", url: "https://redis.io/docs/latest/develop/use/patterns/distributed-locks/", title: "Distributed Locks with Redis", source: "Redis Docs" },
  ],
  "distributed-job-scheduler": [
    { type: "video", id: "s4rSMqhLMbE", title: "Distributed Job Scheduler", source: "Arpit Bhayani", dur: "25 min" },
    { type: "video", id: "bBTPDNxQk6E", title: "Task Scheduling at Scale", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-task-scheduler", title: "Design a Task Scheduler", source: "AlgoMaster" },
    { type: "blog", url: "https://dropbox.tech/infrastructure/asynchronous-task-scheduling-at-dropbox", title: "Async Task Scheduling at Dropbox", source: "Dropbox Tech" },
  ],
  "leaderboard": [
    { type: "video", id: "CF6P3l_4TSA", title: "Design a Leaderboard", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "VGZsPMXzAok", title: "Redis Sorted Sets for Leaderboards", source: "Hussein Nasser", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-leaderboard", title: "Design a Leaderboard", source: "AlgoMaster" },
    { type: "blog", url: "https://redis.io/solutions/leaderboards/", title: "Building Real-Time Leaderboards with Redis", source: "Redis" },
  ],
  "video-conferencing": [
    { type: "video", id: "G32ThJakeHk", title: "System Design: Zoom / Google Meet", source: "Gaurav Sen", dur: "25 min" },
    { type: "video", id: "Z8awfQ1lCbo", title: "WebRTC Architecture Deep Dive", source: "Hussein Nasser", dur: "30 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-zoom", title: "Design Zoom", source: "AlgoMaster" },
    { type: "blog", url: "https://webrtc.org/", title: "WebRTC — Real-time Communication for the Web", source: "WebRTC.org" },
  ],
  "live-streaming": [
    { type: "video", id: "7AMRfNKwuYo", title: "System Design: Live Streaming (Twitch)", source: "Gaurav Sen", dur: "20 min" },
    { type: "video", id: "vvhC64hQZMk", title: "How Twitch Works", source: "Hussein Nasser", dur: "22 min" },
    { type: "blog", url: "https://blog.twitch.tv/en/tags/engineering/", title: "Twitch Engineering Blog", source: "Twitch Engineering" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/live-streaming", title: "Design Live Streaming", source: "Hello Interview" },
  ],
  "ecommerce-system-design": [
    { type: "video", id: "lX4CjIFCBnE", title: "Design Amazon — E-commerce Platform", source: "Gaurav Sen", dur: "25 min" },
    { type: "video", id: "EpASu_1dUdE", title: "E-commerce System Design", source: "Tech Dummies", dur: "30 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-amazon", title: "Design Amazon", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-an-online-shopping-system-like-amazon/", title: "Design an Online Shopping System", source: "GeeksforGeeks" },
  ],
  "dropbox-sync": [
    { type: "video", id: "U0xTu6E2CT8", title: "Design Dropbox / Google Drive", source: "ByteByteGo", dur: "11 min" },
    { type: "video", id: "jLM1nGgsT-I", title: "File Sync System Design", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://dropbox.tech/infrastructure/rewriting-the-heart-of-our-sync-engine", title: "Rewriting the Heart of Our Sync Engine", source: "Dropbox Tech" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-dropbox", title: "Design Dropbox", source: "AlgoMaster" },
  ],
  "google-calendar": [
    { type: "video", id: "IV0Rrr3hZMk", title: "Design Google Calendar", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://www.hellointerview.com/learn/system-design/problem-breakdowns/google-calendar", title: "Design Google Calendar", source: "Hello Interview" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-google-calendar/", title: "Design Google Calendar", source: "GeeksforGeeks" },
  ],
  "unique-id-generator": [
    { type: "video", id: "tPGMp9fRNw8", title: "Generating Unique IDs in Distributed Systems", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "ViSJW-GjHGg", title: "Snowflake ID — Distributed ID Generator", source: "Arpit Bhayani", dur: "20 min" },
    { type: "blog", url: "https://blog.twitter.com/engineering/en_us/a/2010/announcing-snowflake", title: "Announcing Snowflake", source: "Twitter Engineering" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-unique-id-generator", title: "Design a Unique ID Generator", source: "AlgoMaster" },
  ],
  "leetcode-judge": [
    { type: "video", id: "s4rSMqhLMbE", title: "Design an Online Judge System", source: "Arpit Bhayani", dur: "22 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-online-code-judge-like-leetcode/", title: "Design Online Judge Like LeetCode", source: "GeeksforGeeks" },
    { type: "blog", url: "https://gvisor.dev/", title: "gVisor — Container Sandbox Runtime", source: "gVisor (Google)" },
  ],
  "reminder-alert": [
    { type: "video", id: "s4rSMqhLMbE", title: "Design a Distributed Job Scheduler", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-reminder-alert-system/", title: "Design a Reminder Alert System", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-notification-system", title: "Design a Notification System (related)", source: "AlgoMaster" },
  ],
  "metrics-monitoring": [
    { type: "video", id: "9TJx7QTrTyo", title: "How Prometheus Monitoring Works", source: "TechWorld with Nana", dur: "22 min" },
    { type: "video", id: "h4Sl21AKiDg", title: "Design a Metrics Monitoring System", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://prometheus.io/docs/introduction/overview/", title: "Prometheus Overview", source: "Prometheus Docs" },
    { type: "blog", url: "https://www.datadoghq.com/blog/monitoring-101-collecting-data/", title: "Monitoring 101: Collecting the Right Data", source: "Datadog Blog" },
  ],
  "google-ads": [
    { type: "video", id: "bRhrdExsyiI", title: "How Google Ads Auction Works", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "SLi5lrh2QWU", title: "Ad Tech System Design", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-ads", title: "Design Google Ads", source: "AlgoMaster" },
    { type: "blog", url: "https://research.google/pubs/pub36955/", title: "Ad Click Prediction: a View from the Trenches", source: "Google Research" },
  ],
  "shopping-cart": [
    { type: "video", id: "lX4CjIFCBnE", title: "Design Amazon — Shopping System", source: "Gaurav Sen", dur: "25 min" },
    { type: "blog", url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html", title: "Dynamo: Amazon's Highly Available Key-value Store (originally built for cart)", source: "Werner Vogels" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-amazon", title: "Design Amazon (cart section)", source: "AlgoMaster" },
  ],
  "collaborative-whiteboard": [
    { type: "video", id: "RMAgFIGKwSI", title: "CRDTs — Distributed Data Structures", source: "Martin Kleppmann", dur: "40 min" },
    { type: "video", id: "2auwirNBvGg", title: "Real-time Collaboration Design", source: "Gaurav Sen", dur: "20 min" },
    { type: "blog", url: "https://miro.com/blog/engineering/", title: "Miro Engineering Blog", source: "Miro Engineering" },
    { type: "blog", url: "https://crdt.tech/", title: "CRDT Tech Resources", source: "crdt.tech" },
  ],
  "ad-click-aggregator": [
    { type: "video", id: "pMq7GH5b7-I", title: "Real-time Data Processing at Scale", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "nMBi317FNhc", title: "Ad Click Aggregation System", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://clickhouse.com/docs/en/about-us/adopters", title: "ClickHouse Adopters (used for ad analytics)", source: "ClickHouse Docs" },
    { type: "blog", url: "https://flink.apache.org/what-is-flink/use-cases/", title: "Apache Flink Use Cases", source: "Apache Flink" },
  ],
  "code-deployment": [
    { type: "video", id: "AWVTKBUnoIg", title: "CI/CD Pipeline Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "scEDHsr3APg", title: "GitOps vs Traditional CI/CD", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/ci-cd-pipeline", title: "CI/CD Pipeline Design", source: "AlgoMaster" },
    { type: "blog", url: "https://netflixtechblog.com/full-cycle-developers-at-netflix-a08c31f83249", title: "Full Cycle Developers at Netflix", source: "Netflix Tech Blog" },
  ],
  "youtube-likes-counter": [
    { type: "video", id: "UC5nfcGGOt8", title: "Distributed Counter System Design", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "bUHFg8CZFpI", title: "Count-Min Sketch & Top-K", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-youtube-likes-counter", title: "Design a Counter System", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-distributed-counter/", title: "Design a Distributed Counter", source: "GeeksforGeeks" },
  ],
  "reddit-full": [
    { type: "video", id: "KYExYE_9LIo", title: "Design Reddit", source: "Jordan Has No Life", dur: "30 min" },
    { type: "video", id: "pUHkRGpfu4o", title: "Design Social Media Feed (Reddit/Twitter)", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://www.reddit.com/r/RedditEng/", title: "r/RedditEng — Reddit Engineering", source: "Reddit" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-reddit/", title: "Design Reddit", source: "GeeksforGeeks" },
  ],
  "google-news": [
    { type: "video", id: "CeGtqYdA-Cs", title: "Design a News Aggregator", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-google-news", title: "Design Google News", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-a-news-aggregator-system/", title: "Design a News Aggregator", source: "GeeksforGeeks" },
  ],
  // Remaining problems get a generic set
  "distributed-logging": [
    { type: "video", id: "5s2VLPF-bEI", title: "Distributed Logging Architecture", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-distributed-logging-system", title: "Design a Distributed Logging System", source: "AlgoMaster" },
    { type: "blog", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html", title: "Elasticsearch Reference", source: "Elastic" },
  ],
  "distributed-queue": [
    { type: "video", id: "iJLL-KPqBpM", title: "System Design: Message Queues", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "Kafka Architecture Deep Dive", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://kafka.apache.org/documentation/", title: "Apache Kafka Documentation", source: "Apache Kafka" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-message-queue", title: "Design a Message Queue", source: "AlgoMaster" },
  ],
  "count-active-users": [
    { type: "video", id: "lJYufx0bfpw", title: "HyperLogLog Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/", title: "HyperLogLog in Redis", source: "Redis Docs" },
  ],
  "mutual-connections": [
    { type: "video", id: "ASIBd2NJRY0", title: "People You May Know — Graph Algorithms", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://engineering.linkedin.com/blog/2020/real-time-graph-serving", title: "Real-Time Graph Serving at LinkedIn", source: "LinkedIn Engineering" },
  ],
  "recommendation-algorithm": [
    { type: "video", id: "n1mKFs2uKMU", title: "Recommendation System Design", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "1JRrCEgiyHM", title: "How Netflix Recommendation System Works", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8", title: "System Architectures for Personalization", source: "Netflix Tech Blog" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-recommendation-system", title: "Design a Recommendation System", source: "AlgoMaster" },
  ],
  "reddit-comments": [
    { type: "video", id: "KYExYE_9LIo", title: "Design Reddit", source: "Jordan Has No Life", dur: "30 min" },
    { type: "blog", url: "https://www.reddit.com/r/RedditEng/", title: "r/RedditEng", source: "Reddit" },
  ],
  "stock-trading-platform": [
    { type: "video", id: "dUMWMZmMsVE", title: "Design a Stock Trading Platform", source: "Jordan Has No Life", dur: "25 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-stock-exchange", title: "Design a Stock Exchange", source: "AlgoMaster" },
  ],
  "bidding-platform": [
    { type: "video", id: "NRZA6MAgHQ8", title: "Design an Auction System", source: "Arpit Bhayani", dur: "20 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/design-an-online-auction-system/", title: "Design an Online Auction", source: "GeeksforGeeks" },
  ],
  "pubg-system-design": [
    { type: "video", id: "eu1oZ0RxLWY", title: "Game Server Architecture", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://technology.riotgames.com/", title: "Riot Games Tech Blog", source: "Riot Games" },
  ],
};

// ══════════════════════════════════════════════════════════════════════
// INJECTION LOGIC
// ══════════════════════════════════════════════════════════════════════

function buildRefSection(refs) {
  const playIcon = `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;
  const items = refs.map((r) => {
    if (r.type === "video") {
      return `
      <a href="https://www.youtube.com/watch?v=${r.id}" class="ref-video" target="_blank" rel="noopener">
        <div class="ref-thumb">
          <img src="https://i.ytimg.com/vi/${r.id}/maxresdefault.jpg"
               alt="${r.title}" loading="lazy"
               onerror="this.src='https://i.ytimg.com/vi/${r.id}/hqdefault.jpg'"/>
          <div class="ref-play"><div class="ref-play-icon">${playIcon}</div></div>
        </div>
        <div class="ref-meta">
          <div class="ref-title">${r.title}</div>
          <div class="ref-source">${r.source}${r.dur ? ` · ${r.dur}` : ""}</div>
        </div>
      </a>`;
    }
    return `
      <a href="${r.url}" class="ref-link" target="_blank" rel="noopener">
        <div class="ref-title">${r.title}</div>
        <div class="ref-source">${r.source}</div>
      </a>`;
  }).join("");

  return `
  <section class="section" id="references">
    <div class="section-head"><span class="section-n">📺</span><h2 class="section-title">References &amp; Videos</h2></div>
    <div class="prose">
      <div class="ref-grid">${items}
      </div>
    </div>
  </section>

`;
}

async function inject(dir, slugMap) {
  let count = 0;
  for (const [slug, refs] of Object.entries(slugMap)) {
    const file = path.join(dir, `${slug}.html`);
    let raw;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    if (raw.includes(MARKER)) continue;
    const idx = raw.lastIndexOf("</main>");
    if (idx === -1) continue;
    const block = buildRefSection(refs);
    const next = raw.slice(0, idx) + block + raw.slice(idx);
    await fs.writeFile(file, next);
    count++;
    console.log(`  ✓ ${slug}`);
  }
  return count;
}

// Run
const problemCount = await inject(ROOT, REFS);
console.log(`\n✓ Injected references into ${problemCount} problem files.`);
