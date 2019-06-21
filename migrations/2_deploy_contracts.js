const ERC1155MixedFungibleMintable = artifacts.require("ERC1155MixedFungibleMintable");

module.exports = function(deployer) {
  deployer.deploy(ERC1155MixedFungibleMintable);
};
