from bs4 import BeautifulSoup
import requests
# import csv




# works for each index grabs html from each item page

#####################################################
# source = requests.get('http://www.seattle.gov/util/MyServices/WhereDoesItGo/Paper/Misc.Paper/PaperBags/index.htm').text

# soup = BeautifulSoup(source, 'lxml')

# region = soup.find(id="content")


# print(region.text)

############################################

source = requests.get('http://www.seattle.gov/util/MyServices/WhereDoesItGo/A-Z/index.htm').text

soup = BeautifulSoup(source, 'lxml')

href = soup.find_all('p',class_="list")
# ind =0
count =0
# for i in href[1]:#32 items
#     count+= 1


# array of stirngs
aTag=[]
urlArray=[]
#loops through all hrefs i being an entire href object
for i in href:
    x = i.find_all('a')
    for j in x:
        aTag.append(j)

# print(aTag[1])


print(type(aTag))

for i in aTag:
    i= str(i)
    href=  i.split(" ")
    href = href[1].lstrip('href="../../..')
    # href = '\"'+href

    href = href.strip('\"')
    urlArray.append(href)
    


#dont touch
# x = href[22].find_all('a')
# print(x[2])

#loop through each url in t array

#set str = url

#push into array called url
Url =urlArray[:10]

itemsArray=[]
h3Array =[]
# loops through array
for i in urlArray:

    itemlink="http://www.seattle.gov/util/"+i
    linkStr= requests.get(""+itemlink+"").text    
    soup1 = BeautifulSoup(linkStr, 'lxml')
    content = soup1.find_all(id="content")


    for i in content:
        itemArray =[]

        # print(i.text)
        # print i.text.encode('utf-8')
        # print(i)


        itemArray.append(i.text.encode('utf-8'))
    print(itemArray)
    itemsArray.append(itemArray)
