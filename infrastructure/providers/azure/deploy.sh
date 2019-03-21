#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# -e: immediately exit if any command has a non-zero exit status
# -o: prevents errors in a pipeline from being masked
# IFS new value is less likely to cause confusing bugs when looping arrays or arguments (e.g. $@)

usage() { echo "Usage: $0 -i <subscriptionId> -g <resourceGroupName> -n <deploymentName> -l <resourceGroupLocation> -p <servicePrincipalClientId> -s <servicePrincipalClientSecret> -a <pgadminpassword> -e <ssh public key>" 1>&2; exit 1; }

declare subscriptionId=""
declare resourceGroupName=""
declare deploymentName=""
declare resourceGroupLocation=""
declare servicePrincipalClientSecret=""
declare servicePrincipalClientId=""
declare pgAdminPassword=""
declare sshPublicKey=""

# Initialize parameters specified from command line
while getopts "hi:g:n:l:p:s:a:e:" arg; do
	case "${arg}" in
		h)
			usage
			exit 0
			;;
		i)
			subscriptionId=${OPTARG}
			;;
		g)
			resourceGroupName=${OPTARG}
			;;
		n)
			deploymentName=${OPTARG}
			;;
		l)
			resourceGroupLocation=${OPTARG}
			;;
		p)
			servicePrincipalClientId=${OPTARG}
			;;
		s)
			servicePrincipalClientSecret=${OPTARG}
			;;
		a)
			pgAdminPassword=${OPTARG}
			;;
		e)
			sshPublicKey=${OPTARG}
			;;
		esac
done
shift $((OPTIND-1))

#Prompt for parameters is some required parameters are missing
if [[ -z "$subscriptionId" ]]; then
	echo "Your subscription ID can be looked up with the CLI using: az account show --out json "
	echo "Enter your subscription ID:"
	read subscriptionId
	[[ "${subscriptionId:?}" ]]
fi

if [[ -z "$resourceGroupName" ]]; then
	echo "This script will look for an existing resource group, otherwise a new one will be created "
	echo "You can create new resource groups with the CLI using: az group create "
	echo "Enter a resource group name"
	read resourceGroupName
	[[ "${resourceGroupName:?}" ]]
fi

if [[ -z "$deploymentName" ]]; then
	echo "Enter a name for this deployment:"
	read deploymentName
fi

if [[ -z "$resourceGroupLocation" ]]; then
	echo "If creating a *new* resource group, you need to set a location "
	echo "You can lookup locations with the CLI using: az account list-locations "

	echo "Enter resource group location:"
	read resourceGroupLocation
fi

if [[ -z "$servicePrincipalClientId" ]]; then
	echo "Your service Principal Client Id should have been provided by the account administrator "
	echo "service Principal Client Id:"
	read servicePrincipalClientId
	[[ "${servicePrincipalClientId:?}" ]]
fi

if [[ -z "$servicePrincipalClientSecret" ]]; then
	echo "Your service Principal Client Secret should have been provided by the account administrator "
	echo "service Principal Client Secret:"
	read servicePrincipalClientSecret
	[[ "${servicePrincipalClientSecret:?}" ]]
fi

if [[ -z "$pgAdminPassword" ]]; then
	echo "Specify an admin password for the hosted Postgres instance "
	echo "service Principal Client Secret:"
	read pgAdminPassword
	[[ "${pgAdminPassword:?}" ]]
fi

if [[ -z "$sshPublicKey" ]]; then
	echo "Specify an ssh public key to use for VM access with 'cat <ssh key>.pub' "
	echo "ssh public key :"
	read sshPublicKey
	[[ "${sshPublicKey:?}" ]]
fi

#templateFile Path - template file to be used
templateFilePath="template.json"

if [ ! -f "$templateFilePath" ]; then
	echo "$templateFilePath not found"
	exit 1
fi

#parameter file path
parametersFilePath="params.json"

if [ ! -f "$parametersFilePath" ]; then
	echo "$parametersFilePath not found"
	exit 1
fi

if [ -z "$subscriptionId" ] || [ -z "$resourceGroupName" ] || [ -z "$deploymentName" ]; then
	echo "Either one of subscriptionId, resourceGroupName, deploymentName is empty"
	usage
fi

#login to azure using your credentials
az account show 1> /dev/null

if [ $? != 0 ];
then
	az login
fi

# Set the default subscription id
az account set --subscription $subscriptionId

set +e

# Check for existing RG
az group show -n $resourceGroupName | grep $resourceGroupName 1> /dev/null

if [ $? != 0 ]; then
	echo "Resource group with name" $resourceGroupName "could not be found. Creating new resource group.."
	set -e
	(
		set -x
		az group create --name $resourceGroupName --location $resourceGroupLocation 1> /dev/null
		sleep 10
	)
	else
	echo "Using existing resource group..."
fi

# Get Service Priciple ObjectId so we can grant secret read acces for Key vault policy
servicePrincipalObjectId=$(az ad sp show --id $servicePrincipalClientId --query "objectId" --output tsv)

# get current users' objectId so it can be the key vault admin
keyVaultAdminObjectId=$(az ad user show --upn-or-object-id $(az account show --query "user.name" --output tsv) --query "objectId" --output tsv)

# get Current TennantID
tenantId=$(az account show --query "tenantId" --output tsv)

# Start deployment
echo "Starting deployment..."
(
	set -x
	az group deployment create --name "$deploymentName" \
		--resource-group "$resourceGroupName" \
		--template-file "$templateFilePath" \
		--parameters "@${parametersFilePath}" \
		--parameters \
			resourceName=$resourceGroupName \
			subscriptionId=$subscriptionId \
			servicePrincipalClientId=$servicePrincipalClientId \
			servicePrincipalObjectId=$servicePrincipalObjectId \
			servicePrincipalClientSecret=$servicePrincipalClientSecret \
			tenantId=$tenantId \
			keyVaultAdminObjectId=$keyVaultAdminObjectId \
			administratorLoginPassword=$pgAdminPassword \
			sshRSAPublicKey=$sshPublicKey
)

if [ $?  == 0 ];
 then
	echo "Template has been successfully deployed"
fi

# add pg secret to the vault
az keyvault secret set --vault-name $deploymentName-vault -n pgSecret --value $pgAdminPassword

# get the Redis primary key
redisSecret=$(az redis list-keys -g orbea -n oiz-redis --query "primaryKey" --output tsv)
# add redis secret to the vault
az keyvault secret set --vault-name $deploymentName-vault -n redisSecret --value $redisSecret

# get the OMS workspace id
omsWorkspaceId=$(az resource show -g $resourceGroupName --resource-type Microsoft.OperationalInsights/workspaces -n $deploymentName-oms --query "properties.customerId"  --output tsv)
# add OMS workspace id to the vault
az keyvault secret set --vault-name oiz-vault -n omsWsId --value $omsWorkspaceId

# get the Application Insights key
applicationInsigtsKey=$(az resource show -g $resourceGroupName --resource-type microsoft.insights/components -n $deploymentName-insights --output=tsv --query "properties.InstrumentationKey")
# add Application Insights key to the vault
az keyvault secret set --vault-name oiz-vault -n insightsKey --value $applicationInsigtsKey

# generate an application password and add it to the vault
pgAppPassword=$(openssl rand -base64 32)
az keyvault secret set --vault-name oiz-vault -n pgAppPassword --value $pgAppPassword



