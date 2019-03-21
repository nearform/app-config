from locust import HttpLocust, TaskSet
import random

cities = [
    "Barcelona",
    "Tramore",
    "Redmond",
    "Cadiz",
    "Amsterdam",
    "Berlin",
    "Bahrein",
    "Dhaka",
    "Singapore",
    "Tokyo",
    "Atlanta",
    "Havana"
]

def city(l):
    print(random.choice(cities))
    l.client.get("/city/" + random.choice(cities))

class UserBehavior(TaskSet):
    tasks = {city: 1}

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 5000
    max_wait = 9000