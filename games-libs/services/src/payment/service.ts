import { sleep } from '@core/utils'
import {
  Currency,
  DepositMethod,
  PaymentProvider,
  WithdrawalMethod,
} from '@dbs/games-types'
import { bovapayService } from './bovapay.service'
import { DEPOSIT_CONFIG_LIST, DEPOSIT_CONFIG_TREE } from './deposit.config'
import {
  DepositOutput,
  DepositParams,
  PaymentProviderService,
  PaymentResult,
  WithdrawalOutput,
  WithdrawalParams,
} from './types'
import {
  WITHDRAWAL_CONFIG_LIST,
  WITHDRAWAL_CONFIG_TREE,
} from './withdrawal.config'

export class PaymentService {
  private providerServices: Map<PaymentProvider, PaymentProviderService> =
    new Map([[PaymentProvider.Bovapay, bovapayService]])

  async getDepositConfigList() {
    await sleep(500)
    return DEPOSIT_CONFIG_LIST
  }

  async getWithdrawalConfigList() {
    await sleep(500)
    return WITHDRAWAL_CONFIG_LIST
  }

  private getProviderService(
    provider: PaymentProvider,
  ): PaymentProviderService {
    const service = this.providerServices.get(provider)

    if (!service) {
      throw new Error(`Payment provider ${provider} not initialized`)
    }

    return service
  }

  private validateDepositBundle(
    method: DepositMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = DEPOSIT_CONFIG_TREE[method]
    if (!methodConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const currencyConfig = methodConfig[currency]
    if (!currencyConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const depositBundle = currencyConfig[provider]
    if (!depositBundle) {
      return {
        result: PaymentResult.UnsupportedCurrency,
        currency,
        method,
      } as const
    }

    return { result: PaymentResult.Success, bundle: depositBundle } as const
  }

  private validateWithdrawalBundle(
    method: WithdrawalMethod,
    provider: PaymentProvider,
    currency: Currency,
  ) {
    const methodConfig = WITHDRAWAL_CONFIG_TREE[method]
    if (!methodConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const currencyConfig = methodConfig[currency]
    if (!currencyConfig) {
      return {
        result: PaymentResult.UnsupportedMethod,
        method,
        provider,
      } as const
    }

    const withdrawalBundle = currencyConfig[provider]
    if (!withdrawalBundle) {
      return {
        result: PaymentResult.UnsupportedCurrency,
        currency,
        method,
      } as const
    }

    return { result: PaymentResult.Success, bundle: withdrawalBundle } as const
  }

  async createDeposit(params: DepositParams): Promise<DepositOutput> {
    const validation = this.validateDepositBundle(
      params.method,
      params.provider,
      params.currency,
    )

    if (validation.result !== PaymentResult.Success) {
      return validation
    }

    const { bundle } = validation

    // Validate amount
    if (bundle.minAmount && params.amount < bundle.minAmount) {
      return {
        result: PaymentResult.InvalidAmount,
        minAmount: bundle.minAmount,
        currency: params.currency,
      }
    }

    if (bundle.maxAmount && params.amount > bundle.maxAmount) {
      return {
        result: PaymentResult.InvalidAmount,
        maxAmount: bundle.maxAmount,
        currency: params.currency,
      }
    }

    try {
      const service = this.getProviderService(params.provider)
      const response = await service.createDeposit(params)

      return {
        result: PaymentResult.Success,
        transactionId: response.transactionId,
        redirectUrl: response.redirectUrl,
        amount: params.amount,
        currency: params.currency,
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          result: PaymentResult.ProviderError,
          error: error.message,
        }
      }
      return {
        result: PaymentResult.Failed,
        error: 'Unknown error occurred',
      }
    }
  }

  async createWithdrawal(params: WithdrawalParams): Promise<WithdrawalOutput> {
    try {
      const service = this.getProviderService(params.provider)
      const response = await service.createWithdrawal({
        userId: params.userId,
        amount: params.amount,
        provider: params.provider,
        method: params.method,
        currency: params.currency,
        userIp: params.userIp,
        email: params.email,
        customerName: params.customerName,
      })

      return {
        result: PaymentResult.Success,
        transactionId: response.transactionId,
        amount: response.amount,
        currency: response.currency,
      }
    } catch (error) {
      return {
        result: PaymentResult.Failed,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async getTransactionStatus(provider: PaymentProvider, transactionId: string) {
    const service = this.getProviderService(provider)
    return service.getTransactionStatus(transactionId)
  }
}

// Export singleton instance
export const paymentService = new PaymentService()

// 1INCHEUR, 1INCHUSD, AAVEETH, AAVEEUR, AAVEGBP, AAVEUSD, AAVEXBT, ACAEUR, ACAUSD, ACHEUR, ACHUSD, ADAAUD, ADAETH, ADAEUR, ADAGBP, ADAUSD, ADAUSDT, ADAXBT, ADXEUR, ADXUSD, AEVOEUR, AEVOUSD, AGLDEUR, AGLDUSD, AIREUR, AIRUSD, AKTEUR, AKTUSD, ALCXEUR, ALCXUSD, ALGOETH, ALGOEUR, ALGOGBP, ALGOUSD, ALGOUSDT, ALGOXBT, ALICEEUR, ALICEUSD, ALPHAEUR, ALPHAUSD, ALTEUR, ALTUSD, AMPEUR, AMPUSD, ANKREUR, ANKRUSD, ANKRXBT, APEEUR, APEUSD, APEUSDT, API3EUR, API3USD, APTEUR, APTUSD, APUEUR, APUUSD, ARBEUR, ARBUSD, ARKMEUR, ARKMUSD, ARPAEUR, ARPAUSD, ASTREUR, ASTRUSD, ATHEUR, ATHUSD, ATLASEUR, ATLASUSD, ATOMETH, ATOMEUR, ATOMGBP, ATOMUSD, ATOMUSDT, ATOMXBT, AUCTIONEUR, AUCTIONUSD, AUDIOEUR, AUDIOUSD, AUDJPY, AUDUSD, AURYEUR, AURYUSD, AVAXEUR, AVAXUSD, AVAXUSDT, AXLEUR, AXLUSD, AXSEUR, AXSUSD, BADGEREUR, BADGERUSD, BALEUR, BALUSD, BANDEUR, BANDUSD, BATEUR, BATUSD, BCHAUD, BCHCHF, BCHETH, BCHEUR, BCHGBP, BCHJPY, BCHUSD, BCHUSDT, BCHXBT, BEAMEUR, BEAMUSD, BICOEUR, BICOUSD, BIGTIMEEUR, BIGTIMEUSD, BITEUR, BITUSD, BLUREUR, BLURUSD, BLZEUR, BLZUSD, BNCEUR, BNCUSD, BNTEUR, BNTUSD, BOBAEUR, BOBAUSD, BODENEUR, BODENUSD, BONDEUR, BONDUSD, BONKEUR, BONKUSD, BOOEUR, BOOUSD, BRICKETH, BRICKEUR, BRICKUSD, BSXEUR, BSXUSD, BTTEUR, BTTUSD, C98EUR, C98USD, CELREUR, CELRUSD, CFGEUR, CFGUSD, CHREUR, CHRUSD, CHZEUR, CHZUSD, CLOUDEUR, CLOUDUSD, CLVEUR, CLVUSD, COMPEUR, COMPUSD, COMPXBT, COTIEUR, COTIUSD, COWEUR, COWUSD, CPOOLEUR, CPOOLUSD, CQTEUR, CQTUSD, CRVEUR, CRVUSD, CSMEUR, CSMUSD, CTSIEUR, CTSIUSD, CVCEUR, CVCUSD, CVXEUR, CVXUSD, CXTEUR, CXTUSD, DAIEUR, DAIUSD, DAIUSDT, DASHEUR, DASHUSD, DBREUR, DBRUSD, DENTEUR, DENTUSD, DOTETH, DOTEUR, DOTGBP, DOTJPY, DOTUSD, DOTUSDT, DOTXBT, DRIFTEUR, DRIFTUSD, DRVEUR, DRVUSD, DYDXEUR, DYDXUSD, DYMEUR, DYMUSD, EGLDEUR, EGLDUSD, EIGENEUR, EIGENUSD, ENAEUR, ENAUSD, ENJETH, ENJEUR, ENJUSD, ENSEUR, ENSUSD, EOSEUR, EOSUSD, EOSUSDT, EQEUR, EQUSD, XETCXETH, XETCZEUR, XETCZUSD, XETCXXBT, ETHAUD, ETHBRL, XETHZCAD, ETHCHF, ETHDAI, XETHZEUR, ETHFIEUR, ETHFIUSD, XETHZGBP, XETHZJPY, ETHPYUSD, XETHZUSD, ETHUSDC, ETHUSDT, ETHWETH, ETHWEUR, ETHWUSD, XETHXXBT, EULEUR, EULUSD, EURAUD, EURBRL, EURCAD, EURCHF, EURGBP, EURJPY, EUROCEUR, EUROCUSD, EURQEUR, EURQUSD, EURTEUR, EURTUSD, EURTUSDT, ZEURZUSD, EWTEUR, EWTUSD, FARMEUR, FARMUSD, FETEUR, FETUSD, FIDAEUR, FIDAUSD, FILETH, FILEUR, FILGBP, FILUSD, FILXBT, FISEUR, FISUSD, FLOKIEUR, FLOKIUSD, FLOWEUR, FLOWUSD, FLREUR, FLRUSD, FLUXEUR, FLUXUSD, FORTHEUR, FORTHUSD, FTMEUR, FTMUSD, FWOGEUR, FWOGUSD, FXSEUR, FXSUSD, GALAEUR, GALAUSD, GALEUR, GALUSD, GARIEUR, GARIUSD, ZGBPZUSD, GEISTEUR, GEISTUSD, GFIEUR, GFIUSD, GHSTEUR, GHSTUSD, GIGAEUR, GIGAUSD, GLMREUR, GLMRUSD, GMTEUR, GMTUSD, GMXEUR, GMXUSD, GNOEUR, GNOUSD, GNTETH, GNTEUR, GNTUSD, GNTXBT, GOATEUR, GOATUSD, GOOEUR, GOOUSD, GROKEUR, GROKUSD, GRTEUR, GRTGBP, GRTUSD, GRTXBT, GSTEUR, GSTUSD, GTCEUR, GTCUSD, HDXEUR, HDXUSD, HFTEUR, HFTUSD, HNTEUR, HNTUSD, HONEYEUR, HONEYUSD, ICPEUR, ICPUSD, ICXEUR, ICXUSD, IDEXEUR, IDEXUSD, IMXEUR, IMXUSD, INJEUR, INJUSD, INTREUR, INTRUSD, IOEUR, IOUSD, JASMYEUR, JASMYUSD, JTOEUR, JTOUSD, JUNOEUR, JUNOUSD, JUPEUR, JUPUSD, KAREUR, KARUSD, KASEUR, KASUSD, KAVAEUR, KAVAUSD, KEEPEUR, KEEPUSD, KEYEUR, KEYUSD, KILTEUR, KILTUSD, KINEUR, KINTEUR, KINTUSD, KINUSD, KMNOEUR, KMNOUSD, KNCEUR, KNCUSD, KP3REUR, KP3RUSD, KSMEUR, KSMGBP, KSMUSD, KUJIEUR, KUJIUSD, L3EUR, L3USD, LCXEUR, LCXUSD, LDOEUR, LDOUSD, LINKAUD, LINKETH, LINKEUR, LINKGBP, LINKJPY, LINKUSD, LINKUSDT, LINKXBT, LITEUR, LITUSD, LMWREUR, LMWRUSD, LOOKSEUR, LOOKSUSD, LPTEUR, LPTUSD, LRCEUR, LRCUSD, LSKEUR, LSKUSD, LTCAUD, LTCCHF, LTCETH, XLTCZEUR, LTCGBP, XLTCZJPY, XLTCZUSD, LTCUSDT, XLTCXXBT, LUNA2EUR, LUNA2USD, LUNAEUR, LUNAUSD, MANAEUR, MANAUSD, MANAUSDT, MANAXBT, MASKEUR, MASKUSD, MATICEUR, MATICGBP, MATICPOL, MATICUSD, MATICUSDT, MATICXBT, MCEUR, MCUSD, MEMEEUR, MEMEUSD, MEWEUR, MEWUSD, MINAEUR, MINAGBP, MINAUSD, MINAXBT, MIREUR, MIRUSD, MKREUR, MKRUSD, MKRXBT, XMLNZEUR, XMLNZUSD, XMLNXXBT, MNDEEUR, MNDEUSD, MNGOEUR, MNGOUSD, MNTEUR, MNTUSD, MOGEUR, MOGUSD, MOONETH, MOONEUR, MOONUSD, MORPHOEUR, MORPHOUSD, MOVREUR, MOVRUSD, MSOLEUR, MSOLUSD, MULTIEUR, MULTIUSD, MVEUR, MVUSD, MXCEUR, MXCUSD, MYROEUR, MYROUSD, NANOEUR, NANOUSD, NEAREUR, NEARUSD, NEIROEUR, NEIROUSD, NESTEUR, NESTUSD, NMREUR, NMRUSD, NODLEUR, NODLUSD, NOSEUR, NOSUSD, NTRNEUR, NTRNUSD, NYMEUR, NYMUSD, OCEANEUR, OCEANUSD, OGNEUR, OGNUSD, OMGEUR, OMGUSD, OMNIEUR, OMNIUSD, ONDOEUR, ONDOUSD, OPEUR, OPUSD, ORCAEUR, ORCAUSD, OSMOEUR, OSMOUSD, OXTEUR, OXTUSD, OXYEUR, OXYUSD, PAXGETH, PAXGEUR, PAXGUSD, PAXGXBT, PDAEUR, PDAUSD, PENDLEEUR, PENDLEUSD, PEOPLEEUR, PEOPLEUSD, PEPEAUD, PEPECAD, PEPEEUR, PEPEGBP, PEPEUSD, PERPEUR, PERPUSD, PHAEUR, PHAUSD, POLEUR, POLISEUR, POLISUSD, POLSEUR, POLSUSD, POLUSD, PONDEUR, PONDUSD, PONKEEUR, PONKEUSD, POPCATEUR, POPCATGBP, POPCATUSD, PORTALEUR, PORTALUSD, POWREUR, POWRUSD, PRCLEUR, PRCLUSD, PRIMEEUR, PRIMEUSD, PSTAKEEUR, PSTAKEUSD, PUFFEREUR, PUFFERUSD, PYTHEUR, PYTHUSD, PYUSDEUR, PYUSDUSD, QNTEUR, QNTUSD, QTUMEUR, QTUMUSD, RADEUR, RADUSD, RAREEUR, RAREUSD, RARIEUR, RARIUSD, RAYEUR, RAYUSD, RBCEUR, RBCUSD, RENDEREUR, RENDERUSD, RENEUR, RENUSD, XREPZEUR, XREPZUSD, REPV2EUR, REPV2USD, REQEUR, REQUSD, REZEUR, REZUSD, RLCEUR, RLCUSD, RMRKEUR, RMRKUSD, RONEUR, RONUSD, ROOKEUR, ROOKUSD, RPLEUR, RPLUSD, RSREUR, RSRUSD, RUNEEUR, RUNEUSD, SAFEEUR, SAFEUSD, SAGAEUR, SAGAUSD, SAMOEUR, SAMOUSD, SANDEUR, SANDGBP, SANDUSD, SANDXBT, SBREUR, SBRUSD, SCEUR, SCRTEUR, SCRTUSD, SCUSD, SCXBT, SDNEUR, SDNUSD, SEIEUR, SEIUSD, SGBEUR, SGBUSD, SHDWEUR, SHDWUSD, SHIBEUR, SHIBUSD, SHIBUSDT, SKYEUR, SKYUSD, SLPEUR, SLPUSD, SMOGEUR, SMOGUSD, SNXEUR, SNXUSD, SNXXBT, SOLAUD, SOLCAD, SOLETH, SOLEUR, SOLGBP, SOLUSD, SOLUSDT, SOLXBT, SPELLEUR, SPELLUSD, SPXEUR, SPXUSD, SRMEUR, SRMUSD, SSVEUR, SSVUSD, STEPEUR, STEPUSD, STGEUR, STGUSD, STORJEUR, STORJUSD, STRDEUR, STRDUSD, STRKEUR, STRKUSD, STRONGEUR, STRONGUSD, STXEUR, STXUSD, SUIEUR, SUIGBP, SUIUSD, SUPEREUR, SUPERUSD, SUSHIEUR, SUSHIUSD, SWELLEUR, SWELLUSD, SXPEUR, SXPUSD, SYNEUR, SYNUSD, SYRUPEUR, SYRUPUSD, TAOEUR, TAOUSD, TBTCEUR, TBTCUSD, TBTCXBT, TEEREUR, TEERUSD, TEUR, TIAEUR, TIAUSD, TLMEUR, TLMUSD, TNSREUR, TNSRUSD, TOKEEUR, TOKENEUR, TOKENUSD, TOKEUSD, TONEUR, TONUSD, TONUSDT, TRACEUR, TRACUSD, TRBEUR, TRBUSD, TREMPEUR, TREMPUSD, TRUEUR, TRUUSD, TRXETH, TRXEUR, TRXUSD, TRXXBT, TURBOEUR, TURBOUSD, TUSD, TUSDEUR, TUSDUSD, TVKEUR, TVKUSD, UMAEUR, UMAUSD, UNFIEUR, UNFIUSD, UNIETH, UNIEUR, UNIUSD, UNIXBT, USDBRL, ZUSDZCAD, USDCAUD, USDCCAD, USDCCHF, USDCEUR, USDCGBP, USDCHF, USDCUSD, USDCUSDT, USDGEUR, USDGUSD, USDGUSDC, ZUSDZJPY, USDQUSD, USDQUSDC, USDQUSDT, USDSEUR, USDSUSD, USDTAUD, USDTBRL, USDTCAD, USDTCHF, USDTEUR, USDTGBP, USDTJPY, USDTZUSD, USTEUR, USTUSD, USTUSDC, USTUSDT, VANRYEUR, VANRYUSD, WAXLEUR, WAXLUSD, WAXPEUR, WAXPUSD, WBTCEUR, WBTCUSD, WBTCXBT, WENEUR, WENUSD, WEUR, WHALESEUR, WHALESUSD, WIFEUR, WIFGBP, WIFUSD, WNXMEUR, WNXMUSD, WOOEUR, WOOUSD, WSOLEUR, WSOLUSD, WUSD, XBTAUD, XBTBRL, XXBTZCAD, XBTCHF, XBTDAI, XXBTZEUR, XXBTZGBP, XXBTZJPY, XBTPYUSD, XXBTZUSD, XBTUSDC, XBTUSDT, XCNEUR, XCNUSD, XDGAUD, XDGCAD, XDGEUR, XDGGBP, XDGUSD, XDGUSDT, XXDGXXBT, XXLMZEUR, XXLMZGBP, XXLMZUSD, XXLMXXBT, XXMRZEUR, XXMRZUSD, XMRUSDT, XXMRXXBT, XOREUR, XORUSD, XRPAUD, XXRPZCAD, XRPCHF, XRPETH, XXRPZEUR, XRPGBP, XXRPZUSD, XRPUSDT, XXRPXXBT, XRTEUR, XRTUSD, XTZEUR, XTZUSD, XTZUSDT, YFIEUR, YFIUSD, YGGEUR, YGGUSD, XZECZEUR, XZECZUSD, XZECXXBT, ZETAEUR, ZETAUSD, ZEUSEUR, ZEUSUSD, ZEXEUR, ZEXUSD, ZKEUR, ZKUSD, ZROEUR, ZROUSD, ZRXETH, ZRXEUR, ZRXUSD, ZRXXBT
