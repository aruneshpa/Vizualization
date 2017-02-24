# Script to parse the CSV file and create the JSON file of nodes and labels
# Author: Arunesh Pandey

import json
class player():
    def __init__(self, name, hand, weight, height, avg, HR):
        self.name = name.strip()
        self.hand = hand.strip()
        self.height = height.strip()
        self.weight = weight.strip()
        self.avg = avg.strip()
        self.HR = HR.strip()

def parse():
    s = set()
    numgroups = 0
    minweight = 1000
    of = open("data/baseball_data_force.json", "w")
    
    # List of objects. One object per line
    objects = []
    f = open("baseball_data_force.csv", "r")
    lines = f.readlines()
    for line in lines:
        if "name" in line:
            continue
        l = line.strip().split(',')
        obj = player(l[0], l[1], l[2], l[3], l[4], l[5])
        objects.append(obj)
        minweight = min(minweight, int(l[2]))
    js = dict()
    nodes = []
    edges = []
    for obj in objects:
        x = dict()
        x["id"] = obj.name
        x["group"] = int(obj.weight) - minweight
        nodes.append(x)
    numedges = 0
    edgeset = set()
    for obj1 in objects:
        for obj2 in  objects:
            if (numedges > 500):
                break
            if obj1.name != obj2.name and (int(obj1.weight) > int(obj2.weight) and float(obj1.avg) > float(obj2.avg)):
                if  obj1.name + "_" + obj2.name in edgeset or obj2.name + "_" + obj1.name in edgeset:
                    continue
                e = dict()
                e["source"] = obj1.name
                e["target"] = obj2.name
                e["value"] = (int(obj1.weight) + int(obj2.weight))//2 - minweight
                edges.append(e)
                numedges += 1
                edgeset.add(obj1.name + "_" + obj2.name)
        if (numedges > 500):
            break
    js["nodes"] = nodes
    js["links"] = edges
    of.write(json.dumps(js, sort_keys=True, indent=4, separators=(',', ': ')))
    f.close()
    of.close()
    
# Main function    
if __name__ == "__main__":
    parse()