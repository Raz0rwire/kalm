import axios from "axios";
import { ThunkResult } from "types";
import { SET_DOMAIN_A_RECORDS, SET_DOMAIN_CNAME } from "types/domain";

interface ARecordResponse {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface CnameResponse {
  TTL: number;
  data: string;
  name: string;
  type: number;
}

export const loadDomainDNSTypeInfo = (domain: string, type: "A" | "CNAME"): ThunkResult<void> => {
  return async (dispatch) => {
    try {
      const res = await axios.get(`https://dns.google.com/resolve?name=${domain}&type=${type}`);
      if (res.data.Answer) {
        const aRecords = (res.data.Answer as ARecordResponse[]).map((aRecord) => aRecord.data);
        dispatch({
          type: SET_DOMAIN_A_RECORDS,
          payload: {
            domain,
            aRecords,
          },
        });
      } else if (res.data.Authority) {
        const cname = (res.data.Authority as CnameResponse[])[0].data;
        dispatch({
          type: SET_DOMAIN_CNAME,
          payload: {
            domain,
            cname,
          },
        });
      }
    } catch (e) {
      console.log(e);
    }
  };
};